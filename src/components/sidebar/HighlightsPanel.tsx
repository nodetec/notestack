'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { XIcon, Trash2Icon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react';
import { fetchUserHighlights } from '@/lib/nostr/fetch';
import { deleteHighlight } from '@/lib/nostr/publish';
import { useSession } from 'next-auth/react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import { useSidebar } from '@/components/ui/sidebar';
import type { Highlight } from '@/lib/nostr/types';

interface HighlightsPanelProps {
  onSelectHighlight?: (highlight: Highlight) => void;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HighlightsPanel({ onSelectHighlight, onClose }: HighlightsPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const queryClient = useQueryClient();
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
    queryKey: ['user-highlights', pubkey, activeRelay],
    queryFn: ({ pageParam }) => fetchUserHighlights({
      pubkey: pubkey!,
      relay: activeRelay,
      limit: 20,
      until: pageParam,
    }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!pubkey && !!activeRelay,
  });

  const highlights = data?.pages.flatMap((page) => page.highlights) ?? [];
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

  const handleDelete = async (highlight: Highlight, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingHighlightId) return;

    setDeletingHighlightId(highlight.id);
    try {
      await deleteHighlight({
        eventId: highlight.id,
        relays,
        secretKey,
      });

      // Remove from cache
      queryClient.setQueryData(
        ['user-highlights', pubkey, activeRelay],
        (oldData: typeof data) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              highlights: page.highlights.filter((h) => h.id !== highlight.id),
            })),
          };
        }
      );
    } catch (err) {
      console.error('Failed to delete highlight:', err);
    } finally {
      setDeletingHighlightId(null);
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
          My Highlights
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 disabled:opacity-50"
            title="Refresh highlights"
            aria-label="Refresh highlights"
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

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Log in to see your highlights
          </div>
        )}

        {isLoggedIn && isLoading && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading highlights...
          </div>
        )}

        {isLoggedIn && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load highlights
          </div>
        )}

        {isLoggedIn && !isLoading && highlights.length === 0 && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            No highlights yet. Select text while reading an article to create highlights.
          </div>
        )}

        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {highlights.map((highlight) => (
            <li key={highlight.id} className="relative group">
              <button
                onClick={() => onSelectHighlight?.(highlight)}
                className="w-full text-left p-3 pr-10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatDate(highlight.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-3 bg-yellow-100/50 dark:bg-yellow-500/20 px-1 rounded">
                    "{highlight.content}"
                  </p>
                  {highlight.context && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 italic">
                      ...{highlight.context.slice(0, 100)}...
                    </p>
                  )}
                </div>
              </button>
              <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => handleDelete(highlight, e)}
                  disabled={deletingHighlightId === highlight.id}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 disabled:opacity-50"
                  title="Delete highlight"
                  aria-label="Delete highlight"
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
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
