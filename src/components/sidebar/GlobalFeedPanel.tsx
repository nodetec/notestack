'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { XIcon, MoreVerticalIcon } from 'lucide-react';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
  } = useInfiniteQuery({
    queryKey: ['global-feed', activeRelay],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 20, until: pageParam, relay: activeRelay }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];

  const handleBroadcast = async (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (broadcastingBlogId || !blog.rawEvent) return;

    setBroadcastingBlogId(blog.id);
    try {
      await broadcastEvent(blog.rawEvent, relays);
    } catch (err) {
      console.error('Failed to broadcast blog:', err);
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
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Explore
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Close panel"
          aria-label="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
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
            return (
              <li key={blog.id} className="relative group">
                <button
                  onClick={() => onSelectBlog?.(blog)}
                  className="w-full text-left p-3 pr-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div>
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
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>{truncateNpub(blog.pubkey)}</span>
                      <span>&middot;</span>
                      <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                    </div>
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

        {/* Load More Button */}
        {hasNextPage && (
          <div className="p-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
