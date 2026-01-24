'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, MoreVerticalIcon, RefreshCwIcon, SearchIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfile } from '@/lib/hooks/useProfiles';
import { useSidebar } from '@/components/ui/sidebar';
import PanelRail from './PanelRail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractFirstImage } from '@/lib/utils/markdown';
import { generateAvatar } from '@/lib/avatar';
import type { Blog } from '@/lib/nostr/types';

interface AuthorFeedPanelProps {
  pubkey: string | null;
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
  onClearAuthor: () => void;
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

export default function AuthorFeedPanel({ pubkey, onSelectBlog, onClose, onClearAuthor }: AuthorFeedPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [localPubkey, setLocalPubkey] = useState<string | null>(pubkey);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
  const { state: sidebarState, isMobile } = useSidebar();

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
    queryFn: ({ pageParam }) => fetchBlogs({ limit: 20, until: pageParam, relay: activeRelay, pubkey: effectivePubkey! }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!effectivePubkey,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];

  // Fetch profile for the author (uses shared cache from batch fetches)
  const { data: authorProfile } = useProfile(effectivePubkey, ['wss://purplepag.es']);

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

  const handleClear = () => {
    setLocalPubkey(null);
    setSearchInput('');
    setSearchError(null);
    onClearAuthor();
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
          Author
        </h2>
        <div className="flex items-center gap-1">
          {effectivePubkey && (
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground disabled:opacity-50"
              title="Refresh feed"
              aria-label="Refresh feed"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          )}
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
              <p className="text-xs text-muted-foreground truncate">
                {truncateNpub(effectivePubkey)}
              </p>
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
            return (
              <li key={blog.id} className="relative group">
                <button
                  onClick={() => onSelectBlog?.({ ...blog, authorName: authorProfile?.name, authorPicture: authorProfile?.picture })}
                  className="w-full text-left p-3 pr-10 hover:bg-sidebar-accent transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground/70 flex-shrink-0">
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {blog.title || 'Untitled'}
                    </h3>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
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
    </div>
  );
}
