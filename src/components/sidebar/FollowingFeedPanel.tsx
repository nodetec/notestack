'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreVerticalIcon, RefreshCwIcon } from 'lucide-react';
import { fetchContacts, fetchFollowingBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useSidebar } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractFirstImage } from '@/lib/utils/markdown';
import type { Blog } from '@/lib/nostr/types';

interface FollowingFeedPanelProps {
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

export default function FollowingFeedPanel({ onSelectBlog, onClose }: FollowingFeedPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const isLoggedIn = sessionStatus === 'authenticated' && !!pubkey;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch user's contacts (follow list)
  const {
    data: contacts,
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
    isRefetching: isRefetchingContacts,
  } = useQuery({
    queryKey: ['contacts', pubkey, activeRelay],
    queryFn: () => fetchContacts({ pubkey: pubkey!, relay: activeRelay }),
    enabled: isHydrated && !!activeRelay && !!pubkey,
  });

  // Fetch blogs from followed users
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingBlogs,
    isError,
    refetch: refetchBlogs,
    isRefetching: isRefetchingBlogs,
  } = useInfiniteQuery({
    queryKey: ['following-feed', activeRelay, contacts],
    queryFn: ({ pageParam }) => fetchFollowingBlogs({
      authors: contacts || [],
      limit: 20,
      until: pageParam,
      relay: activeRelay,
    }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!contacts && contacts.length > 0,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];

  // Fetch profiles for all blog authors
  const authorPubkeys = blogs.length > 0 ? blogs.map((blog) => blog.pubkey) : [];
  const profileRelays = activeRelay
    ? [activeRelay, 'wss://purplepag.es']
    : [];
  const { data: profiles } = useProfiles(authorPubkeys, profileRelays);

  // Infinite scroll with intersection observer
  const { ref: loadMoreRef } = useInView({
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleRefresh = () => {
    refetchContacts();
    refetchBlogs();
  };

  const isLoading = isLoadingContacts || isLoadingBlogs;
  const isRefetching = isRefetchingContacts || isRefetchingBlogs;

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
      className="fixed inset-y-0 z-50 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Following
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Log in to see posts from people you follow
          </div>
        )}

        {isLoggedIn && isLoading && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading...
          </div>
        )}

        {isLoggedIn && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load blogs
          </div>
        )}

        {isLoggedIn && !isLoading && contacts && contacts.length === 0 && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Follow users to see their posts here
          </div>
        )}

        {isLoggedIn && !isLoading && contacts && contacts.length > 0 && blogs.length === 0 && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            No blogs from followed users yet
          </div>
        )}

        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {blogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            const profile = profiles?.get(blog.pubkey);
            return (
              <li key={blog.id} className="relative group">
                <button
                  onClick={() => onSelectBlog?.({ ...blog, authorName: profile?.name, authorPicture: profile?.picture })}
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
