'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreHorizontalIcon, RefreshCwIcon, DownloadIcon, SendIcon, CodeIcon, SearchIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useSidebar } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventJsonDialog from '@/components/ui/EventJsonDialog';
import { extractFirstImage } from '@/lib/utils/markdown';
import { downloadMarkdownFile } from '@/lib/utils/download';
import { generateAvatar } from '@/lib/avatar';
import StackMenuSub from '@/components/stacks/StackMenuSub';
import type { Blog } from '@/lib/nostr/types';

interface SearchPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onSelectAuthor?: (pubkey: string) => void;
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

function truncateNpub(pubkey: string): string {
  const npub = nip19.npubEncode(pubkey);
  return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
}

export default function SearchPanel({ onSelectBlog, onSelectAuthor, onClose, selectedBlogId }: SearchPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
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
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['search-feed', activeRelay],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 50, until: pageParam, relay: activeRelay }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay,
  });

  const allBlogs = data?.pages.flatMap((page) => page.blogs) ?? [];

  const filteredBlogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const query = searchQuery.toLowerCase();
    return allBlogs.filter((blog) => {
      const titleMatch = blog.title.toLowerCase().includes(query);
      const summaryMatch = blog.summary?.toLowerCase().includes(query);
      return titleMatch || summaryMatch;
    });
  }, [allBlogs, searchQuery]);

  const pubkeys = filteredBlogs.length > 0 ? filteredBlogs.map((blog) => blog.pubkey) : [];
  const { isLoading: isLoadingProfiles, isFetching: isFetchingProfiles, getProfile } = useProfiles(pubkeys, relays);

  const { ref: loadMoreRef } = useInView({
    rootMargin: '200px',
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage && searchQuery.trim()) {
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
      <div className="flex flex-col gap-2 px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground/80">
            Search
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground disabled:opacity-50"
              title="Refresh articles"
              aria-label="Refresh articles"
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
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none">
        {!searchQuery.trim() && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <p>Enter a search term to find articles</p>
          </div>
        )}

        {searchQuery.trim() && isLoading && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading articles...
          </div>
        )}

        {searchQuery.trim() && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load articles
          </div>
        )}

        {searchQuery.trim() && !isLoading && filteredBlogs.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No articles found matching &quot;{searchQuery}&quot;
          </div>
        )}

        <ul className="divide-y divide-border">
          {filteredBlogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            const profile = getProfile(blog.pubkey);
            const isProfileLoading = !profile && (isLoadingProfiles || isFetchingProfiles);
            const avatarUrl = profile?.picture || generateAvatar(blog.pubkey);
            const displayName = profile?.name || truncateNpub(blog.pubkey);
            const isSelected = blog.id === selectedBlogId;
            return (
              <li key={blog.id} className="relative group p-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectBlog?.({ ...blog, authorName: profile?.name, authorPicture: profile?.picture })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectBlog?.({ ...blog, authorName: profile?.name, authorPicture: profile?.picture });
                    }
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAuthor?.(blog.pubkey);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectAuthor?.(blog.pubkey);
                          }
                        }}
                        className="flex items-center gap-2 hover:underline cursor-default min-w-0 overflow-hidden"
                      >
                        {isProfileLoading ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          </>
                        ) : (
                          <>
                            <img
                              src={avatarUrl}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                            <span className="text-xs text-muted-foreground truncate">
                              {displayName}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {blog.title || 'Untitled'}
                    </h3>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {searchQuery.trim() && hasNextPage && (
          <div ref={loadMoreRef} className="p-4 text-center text-muted-foreground text-sm">
            {isFetchingNextPage && 'Loading more...'}
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
