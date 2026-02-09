"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  MoreHorizontalIcon,
  RefreshCwIcon,
  DownloadIcon,
  SendIcon,
  CodeIcon,
  XIcon,
  HeartIcon,
  MessageCircleIcon,
} from "lucide-react";
import { nip19 } from "nostr-tools";
import { useSession } from "next-auth/react";
import { fetchBlogs, fetchContacts, fetchFollowingBlogs } from "@/lib/nostr/fetch";
import { broadcastEvent } from "@/lib/nostr/publish";
import { toast } from "sonner";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useTagStore } from "@/lib/stores/tagStore";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useInteractionCounts } from "@/lib/hooks/useInteractionCounts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EventJsonDialog from "@/components/ui/EventJsonDialog";
import InteractionCountValue from "@/components/ui/InteractionCountValue";
import { extractFirstImage } from "@/lib/utils/markdown";
import { downloadMarkdownFile } from "@/lib/utils/download";
import { generateAvatar } from "@/lib/avatar";
import { blogToNaddr } from "@/lib/nostr/naddr";
import StackMenuSub from "@/components/stacks/StackMenuSub";
import type { Blog } from "@/lib/nostr/types";
import type { UserWithKeys } from "@/types/auth";

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateNpub(pubkey: string): string {
  const npub = nip19.npubEncode(pubkey);
  return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ExploreFeed() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(
    null,
  );
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
  const setActiveTag = useTagStore((state) => state.setActiveTag);
  const tagParam = searchParams.get("tag");
  const activeTag = tagParam
    ? tagParam.toLowerCase().trim().replace(/^#/, "") || null
    : null;
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const isLoggedIn = sessionStatus === "authenticated" && !!pubkey;
  const feedMode = searchParams.get("feed") === "following" ? "following" : "latest";
  const isFollowingView = feedMode === "following";

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setActiveTag(activeTag);
  }, [activeTag, isHydrated, setActiveTag]);

  const setTagInUrl = useCallback(
    (nextTag: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextTag) {
        params.set("tag", nextTag);
      } else {
        params.delete("tag");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const clearTag = useCallback(() => {
    setActiveTag(null);
    setTagInUrl(null);
  }, [setActiveTag, setTagInUrl]);

  const setFeedModeInUrl = useCallback(
    (nextMode: "latest" | "following") => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMode === "latest") {
        params.delete("feed");
      } else {
        params.set("feed", "following");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const {
    data: latestData,
    fetchNextPage: fetchNextLatestPage,
    hasNextPage: hasNextLatestPage,
    isFetchingNextPage: isFetchingNextLatestPage,
    isLoading: isLoadingLatest,
    isError: isLatestError,
    refetch: refetchLatest,
    isRefetching: isRefetchingLatest,
  } = useInfiniteQuery({
    queryKey: ["global-feed", activeRelay, activeTag || ""],
    queryFn: ({ pageParam }) =>
      fetchBlogs({
        limit: 20,
        until: pageParam,
        relay: activeRelay,
        tag: activeTag || undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay,
  });

  const {
    data: contacts,
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
    isRefetching: isRefetchingContacts,
  } = useQuery({
    queryKey: ["contacts", pubkey, activeRelay],
    queryFn: () => fetchContacts({ pubkey: pubkey!, relay: activeRelay }),
    enabled: isHydrated && !!activeRelay && !!pubkey,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: followingData,
    fetchNextPage: fetchNextFollowingPage,
    hasNextPage: hasNextFollowingPage,
    isFetchingNextPage: isFetchingNextFollowingPage,
    isLoading: isLoadingFollowing,
    isError: isFollowingError,
    refetch: refetchFollowing,
    isRefetching: isRefetchingFollowing,
  } = useInfiniteQuery({
    queryKey: ["following-feed", activeRelay, (contacts ?? []).join(","), activeTag || ""],
    queryFn: ({ pageParam }) =>
      fetchFollowingBlogs({
        authors: contacts || [],
        limit: 20,
        until: pageParam,
        relay: activeRelay,
        tag: activeTag || undefined,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled:
      isHydrated &&
      isFollowingView &&
      !!activeRelay &&
      !!pubkey &&
      !!contacts &&
      contacts.length > 0,
  });

  const latestBlogs = latestData?.pages.flatMap((page) => page.blogs) ?? [];
  const followingBlogs =
    followingData?.pages.flatMap((page) => page.blogs) ?? [];
  const blogs = isFollowingView ? followingBlogs : latestBlogs;
  const countEventIds = blogs
    .filter((blog) => blog.likeCount === undefined || blog.replyCount === undefined)
    .map((blog) => blog.id);
  const { getCounts, isLoading: isInteractionCountLoading } = useInteractionCounts(countEventIds);

  // Fetch profiles for all blog authors (only when we have blogs)
  const pubkeys = blogs.length > 0 ? blogs.map((blog) => blog.pubkey) : [];
  const {
    isProfilePending,
    getProfile,
  } = useProfiles(pubkeys);

  // Infinite scroll with intersection observer
  const { ref: loadMoreRef } = useInView({
    rootMargin: "200px",
    onChange: (inView) => {
      if (!inView) return;

      if (isFollowingView) {
        if (hasNextFollowingPage && !isFetchingNextFollowingPage) {
          fetchNextFollowingPage();
        }
        return;
      }

      if (hasNextLatestPage && !isFetchingNextLatestPage) {
        fetchNextLatestPage();
      }
    },
  });

  const isLoading = isFollowingView
    ? isLoadingContacts || isLoadingFollowing
    : isLoadingLatest;
  const isError = isFollowingView ? isFollowingError : isLatestError;
  const hasNextPage = isFollowingView
    ? hasNextFollowingPage
    : hasNextLatestPage;
  const isFetchingNextPage = isFollowingView
    ? isFetchingNextFollowingPage
    : isFetchingNextLatestPage;
  const isRefetching = isFollowingView
    ? isRefetchingContacts || isRefetchingFollowing
    : isRefetchingLatest;

  const handleRefresh = () => {
    if (isFollowingView) {
      refetchContacts();
      refetchFollowing();
      return;
    }
    refetchLatest();
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
        const relayList = successfulRelays.map((r) => r.relay).join("\n");
        toast.success("Article broadcast!", {
          description: `Sent to ${successCount} relay${successCount !== 1 ? "s" : ""}:\n${relayList}`,
          duration: 5000,
        });
      } else {
        toast.error("Broadcast failed", {
          description: "Failed to broadcast to any relay",
        });
      }
    } catch (err) {
      console.error("Failed to broadcast blog:", err);
      toast.error("Broadcast failed", {
        description: err instanceof Error ? err.message : "Unknown error",
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
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-5 border-b border-border/70 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-5 text-sm">
                <button
                  onClick={() => setFeedModeInUrl("latest")}
                  className={`relative -mb-px border-b-2 pb-2 transition-colors ${
                    !isFollowingView
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setFeedModeInUrl("following")}
                  className={`relative -mb-px border-b-2 pb-2 transition-colors ${
                    isFollowingView
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Following
                </button>
              </div>
              <div className="mb-2 flex items-center gap-2">
                {activeTag && (
                  <button
                    onClick={clearTag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 dark:bg-primary/20 text-primary rounded-full hover:bg-primary/20 dark:hover:bg-primary/30"
                  >
                    #{activeTag}
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isRefetching}
                  className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
                  title="Refresh feed"
                  aria-label="Refresh feed"
                >
                  <RefreshCwIcon className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {isFollowingView && !isLoggedIn && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Log in to see posts from people you follow
            </div>
          )}

          {isLoading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          )}

          {isFollowingView && isLoggedIn && !isLoading && contacts && contacts.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Follow users to see their posts here
            </div>
          )}

          {isError && isFollowingView && isLoggedIn && (
            <div className="p-4 text-center text-red-500 text-sm">
              Failed to load blogs
            </div>
          )}

          {isError && !isFollowingView && (
            <div className="p-4 text-center text-red-500 text-sm">
              Failed to load blogs
            </div>
          )}

          {!isLoading &&
            !isError &&
            isFollowingView &&
            isLoggedIn &&
            contacts &&
            contacts.length > 0 &&
            blogs.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No blogs from followed users yet
              </div>
            )}

          {!isLoading && !isError && !isFollowingView && blogs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No blogs found
            </div>
          )}

          <ul className="divide-y divide-border/60">
            {blogs.map((blog) => {
              const thumbnail = blog.image || extractFirstImage(blog.content);
              // getProfile checks both batch result and individual cache (from AuthorFeedView)
              const profile = getProfile(blog.pubkey);
              // Show skeleton while this specific profile is loading, fallback to dicebear/npub only when loaded but not found
              const isProfileLoading = isProfilePending(blog.pubkey);
              const avatarUrl = profile?.picture || generateAvatar(blog.pubkey);
              const displayName = profile?.name || truncateNpub(blog.pubkey);
              const naddr = blogToNaddr(blog, relays);
              const readMinutes = estimateReadTime(
                blog.content || blog.summary || "",
              );
              const interaction = getCounts(blog.id);
              const likeCount = interaction?.likeCount ?? blog.likeCount;
              const replyCount = interaction?.replyCount ?? blog.replyCount;
              const isCountLoading =
                isInteractionCountLoading(blog.id) &&
                likeCount === undefined &&
                replyCount === undefined;
              return (
                <li key={blog.id} className="py-5">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/author/${nip19.npubEncode(blog.pubkey)}`}
                        className="flex items-center gap-2 hover:underline min-w-0 overflow-hidden"
                      >
                        {isProfileLoading ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
                            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          </>
                        ) : (
                          <>
                            {/*eslint-disable-next-line @next/next/no-img-element*/}
                            <img
                              src={avatarUrl}
                              alt=""
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                            <span className="truncate">{displayName}</span>
                          </>
                        )}
                      </Link>
                      <span className="text-muted-foreground/70">&middot;</span>
                      <span className="text-muted-foreground/70">
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="p-1 rounded hover:bg-muted hover:ring-1 hover:ring-border text-muted-foreground shrink-0"
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
                            e.preventDefault();
                            e.stopPropagation();
                            downloadMarkdownFile(blog.title, blog.content || "");
                          }}
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleBroadcast(blog, e);
                          }}
                          disabled={
                            broadcastingBlogId === blog.id || !blog.rawEvent
                          }
                        >
                          <SendIcon className="w-4 h-4" />
                          {broadcastingBlogId === blog.id
                            ? "Broadcasting..."
                            : "Broadcast"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
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
                  <Link
                    href={`/${naddr}`}
                    className="group mt-2 flex items-start gap-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-foreground">
                        {blog.title || "Untitled"}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {blog.summary}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground/70">
                        <span>{readMinutes} min read</span>
                        <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
                          <span className="inline-flex items-center gap-1">
                            <HeartIcon className="h-3 w-3" />
                            <InteractionCountValue value={likeCount} loading={isCountLoading} />
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageCircleIcon className="h-3 w-3" />
                            <InteractionCountValue value={replyCount} loading={isCountLoading} />
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-md overflow-hidden">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="h-full w-full" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="p-4 text-center text-muted-foreground text-sm"
            >
              {isFetchingNextPage && "Loading..."}
            </div>
          )}
        </div>
      </div>
      <EventJsonDialog
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
        event={jsonEvent}
      />
    </div>
  );
}
