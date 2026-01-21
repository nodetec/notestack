'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreVerticalIcon, RefreshCwIcon } from 'lucide-react';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useTagStore } from '@/lib/stores/tagStore';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractFirstImage } from '@/lib/utils/markdown';
import type { Blog } from '@/lib/nostr/types';

interface GlobalFeedPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateNpub(pubkey: string): string {
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
}

export default function GlobalFeedPanel({ onSelectBlog, onClose }: GlobalFeedPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
  const { state: sidebarState, isMobile } = useSidebar();
  const activeTag = useTagStore((state) => state.activeTag);
  const setActiveTag = useTagStore((state) => state.setActiveTag);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['global-feed', activeRelay, activeTag],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 20, until: pageParam, relay: activeRelay, tag: activeTag || undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];

  // Fetch profiles for all blog authors (only when we have blogs)
  const pubkeys = blogs.length > 0 ? blogs.map((blog) => blog.pubkey) : [];
  const profileRelays = activeRelay
    ? [activeRelay, 'wss://purplepag.es']
    : [];
  const { data: profiles } = useProfiles(pubkeys, profileRelays);

  // Infinite scroll with intersection observer
  const { ref: loadMoreRef } = useInView({
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleBroadcast = async (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (broadcastingBlogId || !blog.rawEvent) return;

    setBroadcastingBlogId(blog.id);
    try {
      const results = await broadcastEvent(blog.rawEvent, relays);
      const successfulRelays = results.filter((r) => r.success);
      const successCount = successfulRelays.length;

      if (successCount > 0) {
        const relayList = successfulRelays.map((r) => r.relay).join('\n');
        toast.success('Article broadcast!', {
          description: `Sent to ${successCount} relay${successCount !== 1 ? 's' : ''}:\n${relayList}`,
          duration: 5000,
        });
      } else {
        toast.error('Broadcast failed', {
          description: 'Failed to broadcast to any relay',
        });
      }
    } catch (err) {
      console.error('Failed to broadcast blog:', err);
      toast.error('Broadcast failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBroadcastingBlogId(null);
    }
  };

  return (
    <div
      className="fixed inset-y-0 z-20 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Explore
          </h2>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900"
            >
              #{activeTag}
              <XIcon className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            title="Close panel"
            aria-label="Close panel"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blog List */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {isLoading && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading blogs...
          </div>
        )}

        {isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load blogs
          </div>
        )}

        {!isLoading && blogs.length === 0 && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            No blogs found
          </div>
        )}

        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {blogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            const profile = profiles?.get(blog.pubkey);
            return (
              <li key={blog.id} className="relative group">
                <button
                  onClick={() => onSelectBlog?.(blog)}
                  className="w-full text-left p-3 pr-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {profile?.picture ? (
                        <img
                          src={profile.picture}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700 flex-shrink-0" />
                      )}
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {profile?.name || truncateNpub(blog.pubkey)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        &middot;
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {blog.title || 'Untitled'}
                    </h3>
                    {blog.summary && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {blog.summary}
                      </p>
                    )}
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        className="max-h-32 rounded object-contain mt-2"
                      />
                    )}
                  </div>
                </button>
                <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                        aria-label="More options"
                      >
                        <MoreVerticalIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => handleBroadcast(blog, e)}
                        disabled={broadcastingBlogId === blog.id || !blog.rawEvent}
                      >
                        {broadcastingBlogId === blog.id ? 'Broadcasting...' : 'Broadcast'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Infinite scroll sentinel */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            {isFetchingNextPage && 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
}
