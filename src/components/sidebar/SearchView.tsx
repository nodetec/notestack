'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { MoreHorizontalIcon, RefreshCwIcon, DownloadIcon, SendIcon, CodeIcon, SearchIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { blogToNaddr } from '@/lib/nostr/naddr';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfiles } from '@/lib/hooks/useProfiles';
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

export default function SearchView() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);

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

  const handleSelectBlog = useCallback((blog: Blog) => {
    const naddr = blogToNaddr(blog, relays);
    router.push(`/${naddr}`);
  }, [router, relays]);

  const handleSelectAuthor = useCallback((pubkey: string) => {
    const npub = nip19.npubEncode(pubkey);
    router.push(`/author/${npub}`);
  }, [router]);

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
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 px-3 sm:px-6 py-3 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Search Articles
          </h1>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
            title="Refresh articles"
            aria-label="Refresh articles"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6">
        {!searchQuery.trim() && (
          <div className="py-12 text-center text-muted-foreground">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Enter a search term to find articles</p>
            <p className="text-xs mt-1 opacity-70">Searches through article titles and summaries</p>
          </div>
        )}

        {searchQuery.trim() && isLoading && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Loading articles...
          </div>
        )}

        {searchQuery.trim() && isError && (
          <div className="py-12 text-center text-red-500 text-sm">
            Failed to load articles
          </div>
        )}

        {searchQuery.trim() && !isLoading && filteredBlogs.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No articles found matching &quot;{searchQuery}&quot;
          </div>
        )}

        <div className="divide-y divide-border py-2">
          {filteredBlogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            const profile = getProfile(blog.pubkey);
            const isProfileLoading = !profile && (isLoadingProfiles || isFetchingProfiles);
            const avatarUrl = profile?.picture || generateAvatar(blog.pubkey);
            const displayName = profile?.name || truncateNpub(blog.pubkey);
            return (
              <article key={blog.id} className="group py-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectBlog({ ...blog, authorName: profile?.name, authorPicture: profile?.picture })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectBlog({ ...blog, authorName: profile?.name, authorPicture: profile?.picture });
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAuthor(blog.pubkey);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectAuthor(blog.pubkey);
                            }
                          }}
                          className="flex items-center gap-2 hover:underline cursor-pointer"
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
                              <span className="text-sm text-muted-foreground">
                                {displayName}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground/70">
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {blog.title || 'Untitled'}
                      </h2>
                      {blog.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {blog.summary}
                        </p>
                      )}
                    </div>
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        className="w-24 h-24 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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
              </article>
            );
          })}
        </div>

        {searchQuery.trim() && hasNextPage && (
          <div ref={loadMoreRef} className="py-4 text-center text-muted-foreground text-sm">
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
