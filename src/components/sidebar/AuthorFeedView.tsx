'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { MoreHorizontalIcon, RefreshCwIcon, SearchIcon, DownloadIcon, SendIcon, CodeIcon, CopyIcon, HeartIcon, MessageCircleIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfile } from '@/lib/hooks/useProfiles';
import { useInteractionCounts } from '@/lib/hooks/useInteractionCounts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventJsonDialog from '@/components/ui/EventJsonDialog';
import InteractionCountValue from '@/components/ui/InteractionCountValue';
import { extractFirstImage } from '@/lib/utils/markdown';
import { downloadMarkdownFile } from '@/lib/utils/download';
import { generateAvatar } from '@/lib/avatar';
import StackMenuSub from '@/components/stacks/StackMenuSub';
import type { Blog } from '@/lib/nostr/types';

interface AuthorFeedViewProps {
  pubkey: string | null;
  onSelectBlog?: (blog: Blog) => void;
  onClearAuthor: () => void;
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

function decodeNpubOrNprofile(input: string): string | null {
  try {
    const trimmed = input.trim();
    // Remove nostr: prefix if present
    const cleaned = trimmed.startsWith('nostr:') ? trimmed.slice(6) : trimmed;

    if (cleaned.startsWith('npub1')) {
      const decoded = nip19.decode(cleaned);
      if (decoded.type === 'npub') {
        return decoded.data;
      }
    } else if (cleaned.startsWith('nprofile1')) {
      const decoded = nip19.decode(cleaned);
      if (decoded.type === 'nprofile') {
        return decoded.data.pubkey;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default function AuthorFeedView({
  pubkey,
  onSelectBlog,
  onClearAuthor,
  selectedBlogId,
}: AuthorFeedViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [localPubkey, setLocalPubkey] = useState<string | null>(pubkey);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync local pubkey with prop
  useEffect(() => {
    setLocalPubkey(pubkey);
    setSearchError(null);
  }, [pubkey]);

  const effectivePubkey = localPubkey;

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
    queryKey: ['author-feed', activeRelay, effectivePubkey],
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 5, until: pageParam, relay: activeRelay, pubkey: effectivePubkey! }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!effectivePubkey,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const countEventIds = blogs
    .filter((blog) => blog.likeCount === undefined || blog.replyCount === undefined)
    .map((blog) => blog.id);
  const { getCounts, isLoading: isInteractionCountLoading } = useInteractionCounts(countEventIds);

  // Fetch profile for the author (uses shared cache from batch fetches)
  const { data: authorProfile } = useProfile(effectivePubkey);

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

  const handleViewJson = (event: unknown | undefined) => {
    if (!event) return;
    setJsonEvent(event);
    setIsJsonOpen(true);
  };

  const handleSearch = () => {
    const decoded = decodeNpubOrNprofile(searchInput);
    if (decoded) {
      setLocalPubkey(decoded);
      setSearchError(null);
      setSearchInput('');
    } else {
      setSearchError('Invalid npub or nprofile');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCopyNpub = async () => {
    if (!effectivePubkey) return;
    try {
      const npub = nip19.npubEncode(effectivePubkey);
      await navigator.clipboard.writeText(npub);
      toast.success('Copied npub');
    } catch (err) {
      console.error('Failed to copy npub:', err);
      toast.error('Failed to copy npub');
    }
  };

  const handleClear = () => {
    setLocalPubkey(null);
    setSearchInput('');
    setSearchError(null);
    onClearAuthor();
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 lg:top-[var(--app-header-height)] flex items-center justify-between border-b border-border/70 bg-background/95 pt-2 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h2 className="text-sm font-medium text-foreground">
          Author
        </h2>
        <div className="flex items-center gap-1">
          {effectivePubkey && (
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Search input when no author selected */}
      {!effectivePubkey && (
        <div className="p-3 border-b border-sidebar-border">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchError(null);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Enter npub..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-sidebar-accent/50 rounded-md border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
          {searchError && (
            <p className="text-xs text-red-500 mt-1">{searchError}</p>
          )}
        </div>
      )}

      {/* Author header when author is selected */}
      {effectivePubkey && (
        <div className="p-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img
              src={authorProfile?.picture || generateAvatar(effectivePubkey)}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {authorProfile?.name || truncateNpub(effectivePubkey)}
              </p>
              <div className="flex items-center gap-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {truncateNpub(effectivePubkey)}
                </p>
                <button
                  onClick={handleCopyNpub}
                  className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
                  title="Copy npub"
                  aria-label="Copy npub"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!effectivePubkey && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Enter an npub to view their articles
          </div>
        )}

        {effectivePubkey && isLoading && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading articles...
          </div>
        )}

        {effectivePubkey && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load articles
          </div>
        )}

        {effectivePubkey && !isLoading && blogs.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No articles found
          </div>
        )}

        <ul className="divide-y divide-border">
          {blogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            const isSelected = blog.id === selectedBlogId;
            const interaction = getCounts(blog.id);
            const likeCount = interaction?.likeCount ?? blog.likeCount;
            const replyCount = interaction?.replyCount ?? blog.replyCount;
            const isCountLoading =
              isInteractionCountLoading(blog.id) &&
              likeCount === undefined &&
              replyCount === undefined;
            return (
              <li key={blog.id} className="relative group p-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectBlog?.({ ...blog, authorName: authorProfile?.name, authorPicture: authorProfile?.picture })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectBlog?.({ ...blog, authorName: authorProfile?.name, authorPicture: authorProfile?.picture });
                    }
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {blog.title || 'Untitled'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                        {blog.summary}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/70">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <HeartIcon className="h-3 w-3" />
                            <InteractionCountValue value={likeCount} loading={isCountLoading} />
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircleIcon className="h-3 w-3" />
                            <InteractionCountValue value={replyCount} loading={isCountLoading} />
                          </span>
                        </div>
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
                    <div className="shrink-0 w-20 aspect-[4/3] rounded overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="h-full w-full" />
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Infinite scroll sentinel */}
        {hasNextPage && (
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
