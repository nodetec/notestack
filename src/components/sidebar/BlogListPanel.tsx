'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreHorizontalIcon, PenLineIcon, RefreshCwIcon, DownloadIcon, SendIcon, CodeIcon, Trash2Icon } from 'lucide-react';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { deleteArticle, broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import { useDraftStore } from '@/lib/stores/draftStore';
import { useSidebar } from '@/components/ui/sidebar';
import PanelRail from './PanelRail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventJsonDialog from '@/components/ui/EventJsonDialog';
import { downloadMarkdownFile } from '@/lib/utils/download';
import { extractFirstImage } from '@/lib/utils/markdown';
import StackMenuSub from '@/components/stacks/StackMenuSub';
import type { Blog } from '@/lib/nostr/types';

interface BlogListPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
  selectedBlogId?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BlogListPanel({ onSelectBlog, onClose, selectedBlogId }: BlogListPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
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

  const handleViewJson = (event: unknown | undefined) => {
    if (!event) return;
    setJsonEvent(event);
    setIsJsonOpen(true);
  };

  return (
    <div
      className="fixed inset-y-0 z-50 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      <PanelRail onClose={onClose} />
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
            const isSelected = blog.id === selectedBlogId;
            return (
            <li key={blog.id} className="relative group p-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectBlog?.(blog)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBlog?.(blog);
                  }
                }}
                className={`w-full text-left p-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
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
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                    {blog.summary}
                  </p>
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt=""
                      className="max-h-32 rounded object-contain mt-2"
                    />
                  )}
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/70">
                    <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-sidebar-accent/60 hover:ring-1 hover:ring-sidebar-ring/40 text-muted-foreground"
                          aria-label="More options"
                        >
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <StackMenuSub blog={blog} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadMarkdownFile(blog.title, blog.content || '');
                          }}
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleBroadcast(blog, e)}
                          disabled={broadcastingBlogId === blog.id || !blog.rawEvent}
                        >
                          <SendIcon className="w-4 h-4" />
                          {broadcastingBlogId === blog.id ? 'Broadcasting...' : 'Broadcast'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewJson(blog.rawEvent);
                          }}
                          disabled={!blog.rawEvent}
                        >
                          <CodeIcon className="w-4 h-4" />
                          View raw JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(blog, e)}
                          disabled={deletingBlogId === blog.id}
                          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                        >
                          <Trash2Icon className="w-4 h-4" />
                          {deletingBlogId === blog.id ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
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
      <EventJsonDialog
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
        event={jsonEvent}
      />
    </div>
  );
}
