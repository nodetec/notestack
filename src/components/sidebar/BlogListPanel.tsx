'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreVerticalIcon, PenLineIcon, RefreshCwIcon } from 'lucide-react';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { deleteArticle, broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import { useDraftStore } from '@/lib/stores/draftStore';
import { useSidebar } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractFirstImage } from '@/lib/utils/markdown';
import type { Blog } from '@/lib/nostr/types';

interface BlogListPanelProps {
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

export default function BlogListPanel({ onSelectBlog, onClose }: BlogListPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const queryClient = useQueryClient();
  const findDraftByLinkedBlog = useDraftStore((state) => state.findDraftByLinkedBlog);
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
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['blogs', pubkey, activeRelay],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 10, until: pageParam, pubkey: pubkey ?? undefined, relay: activeRelay }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!pubkey && !!activeRelay,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const isLoggedIn = isHydrated && !!pubkey;

  // Infinite scroll with intersection observer
  const { ref: loadMoreRef } = useInView({
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleDelete = async (blog: Blog, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingBlogId) return;

    setDeletingBlogId(blog.id);
    try {
      await deleteArticle({ eventId: blog.id, relays, secretKey });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    } catch (err) {
      console.error('Failed to delete blog:', err);
    } finally {
      setDeletingBlogId(null);
    }
  };

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
        <h2 className="text-sm font-semibold text-foreground/80">
          My Blogs
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground disabled:opacity-50"
            title="Refresh blogs"
            aria-label="Refresh blogs"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
            title="Close panel"
            aria-label="Close panel"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blog List */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p>Sign in to see your blogs here.</p>
          </div>
        )}

        {isLoggedIn && isLoading && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading blogs...
          </div>
        )}

        {isLoggedIn && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load blogs
          </div>
        )}

        {isLoggedIn && !isLoading && blogs.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No blogs found
          </div>
        )}

        <ul className="divide-y divide-border">
          {blogs.map((blog) => {
            const hasDraftEdit = !!findDraftByLinkedBlog(blog.pubkey, blog.dTag);
            const thumbnail = blog.image || extractFirstImage(blog.content);
            return (
            <li key={blog.id} className="relative group">
              <button
                onClick={() => onSelectBlog?.(blog)}
                className="w-full text-left p-3 pr-10 hover:bg-sidebar-accent transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {blog.title}
                    </h3>
                    {hasDraftEdit && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 dark:bg-primary/20 text-primary rounded" title="Has unpublished edits">
                        <PenLineIcon className="w-3 h-3" />
                        Editing
                      </span>
                    )}
                  </div>
                  {blog.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
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
                      className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
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
                    <DropdownMenuItem
                      onClick={(e) => handleDelete(blog, e)}
                      disabled={deletingBlogId === blog.id}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      {deletingBlogId === blog.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
          })}
        </ul>

        {/* Infinite scroll sentinel */}
        {isLoggedIn && hasNextPage && (
          <div ref={loadMoreRef} className="p-4 text-center text-muted-foreground text-sm">
            {isFetchingNextPage && 'Loading...'}
          </div>
        )}
      </div>
    </div>
  );
}
