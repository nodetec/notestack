'use client';

import { useState, useEffect } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { MoreHorizontalIcon, RefreshCwIcon, DownloadIcon, SendIcon, CodeIcon, HeartIcon, MessageCircleIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { fetchContacts, fetchFollowingBlogs } from '@/lib/nostr/fetch';
import { broadcastEvent } from '@/lib/nostr/publish';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useInteractionCounts } from '@/lib/hooks/useInteractionCounts';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
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

interface FollowingFeedViewProps {
  onSelectBlog?: (blog: Blog) => void;
  onSelectAuthor?: (pubkey: string) => void;
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

export default function FollowingFeedView({
  onSelectBlog,
  onSelectAuthor,
  selectedBlogId,
}: FollowingFeedViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
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
      limit: 5,
      until: pageParam,
      relay: activeRelay,
    }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!contacts && contacts.length > 0,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const countEventIds = blogs
    .filter((blog) => blog.likeCount === undefined || blog.replyCount === undefined)
    .map((blog) => blog.id);
  const { getCounts, isLoading: isInteractionCountLoading } = useInteractionCounts(countEventIds);

  // Fetch profiles for all blog authors
  const authorPubkeys = blogs.length > 0 ? blogs.map((blog) => blog.pubkey) : [];
  const { isProfilePending, getProfile } = useProfiles(authorPubkeys);

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

  const handleViewJson = (event: unknown | undefined) => {
    if (!event) return;
    setJsonEvent(event);
    setIsJsonOpen(true);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 lg:top-[var(--app-header-height)] flex items-center justify-between border-b border-border/70 bg-background/95 pt-2 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <h2 className="text-sm font-medium text-foreground">
          Following
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Log in to see posts from people you follow
          </div>
        )}

        {isLoggedIn && isLoading && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {isLoggedIn && isError && (
          <div className="p-4 text-center text-red-500 text-sm">
            Failed to load blogs
          </div>
        )}

        {isLoggedIn && !isLoading && contacts && contacts.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Follow users to see their posts here
          </div>
        )}

        {isLoggedIn && !isLoading && contacts && contacts.length > 0 && blogs.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No blogs from followed users yet
          </div>
        )}

        <ul className="divide-y divide-border">
          {blogs.map((blog) => {
            const thumbnail = blog.image || extractFirstImage(blog.content);
            // getProfile checks both batch result and individual cache (from AuthorFeedView)
            const profile = getProfile(blog.pubkey);
            // Show skeleton while this specific profile is loading, fallback to dicebear/npub only when loaded but not found
            const isProfileLoading = isProfilePending(blog.pubkey);
            const avatarUrl = profile?.picture || generateAvatar(blog.pubkey);
            const displayName = profile?.name || truncateNpub(blog.pubkey);
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
                  onClick={() => onSelectBlog?.({ ...blog, authorName: profile?.name, authorPicture: profile?.picture })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectBlog?.({ ...blog, authorName: profile?.name, authorPicture: profile?.picture });
                    }
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
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
