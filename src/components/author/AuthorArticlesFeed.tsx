"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  MoreHorizontalIcon,
  DownloadIcon,
  SendIcon,
  CodeIcon,
  PencilIcon,
  HeartIcon,
  MessageCircleIcon,
  PinIcon,
} from "lucide-react";
import { nip19 } from "nostr-tools";
import { useSession } from "next-auth/react";
import { fetchBlogs, fetchPinnedArticles, fetchBlogByAddress } from "@/lib/nostr/fetch";
import { broadcastEvent, publishPinnedArticles } from "@/lib/nostr/publish";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useProfile } from "@/lib/hooks/useProfiles";
import { useInteractionCounts } from "@/lib/hooks/useInteractionCounts";
import { generateAvatar } from "@/lib/avatar";
import { extractFirstImage } from "@/lib/utils/markdown";
import { downloadMarkdownFile } from "@/lib/utils/download";
import { blogToNaddr } from "@/lib/nostr/naddr";
import EventJsonDialog from "@/components/ui/EventJsonDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InteractionCountValue from "@/components/ui/InteractionCountValue";
import StackMenuSub from "@/components/stacks/StackMenuSub";
import type { Blog } from "@/lib/nostr/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import type { UserWithKeys } from "@/types/auth";

interface AuthorArticlesFeedProps {
  npub: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function decodeNpubOrNprofile(input: string): string | null {
  try {
    const decoded = nip19.decode(input.trim());
    if (decoded.type === "npub") return decoded.data;
    if (
      decoded.type === "nprofile" &&
      typeof decoded.data === "object" &&
      decoded.data &&
      "pubkey" in decoded.data
    ) {
      return decoded.data.pubkey as string;
    }
    return null;
  } catch {
    return null;
  }
}

export default function AuthorArticlesFeed({ npub }: AuthorArticlesFeedProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(
    null,
  );
  const [isPinning, setIsPinning] = useState(false);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const relays = useSettingsStore((state) => state.relays);
  const { data: session } = useSession();
  const viewer = session?.user as UserWithKeys | undefined;
  const viewerPubkey = viewer?.publicKey;
  const pubkey = useMemo(() => decodeNpubOrNprofile(npub), [npub]);
  const isOwnProfile = !!pubkey && !!viewerPubkey && pubkey === viewerPubkey;
  const authorNpub = useMemo(
    () => (pubkey ? nip19.npubEncode(pubkey) : null),
    [pubkey],
  );

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
  } = useInfiniteQuery({
    queryKey: ["author-page-feed", activeRelay, pubkey],
    queryFn: ({ pageParam }) =>
      fetchBlogs({
        limit: 5,
        until: pageParam,
        relay: activeRelay,
        pubkey: pubkey!,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!pubkey,
  });

  const { data: pinnedData, refetch: refetchPinnedData } = useQuery({
    queryKey: ["pinned-articles", activeRelay, pubkey],
    queryFn: () =>
      fetchPinnedArticles({
        pubkey: pubkey!,
        relay: activeRelay,
      }),
    enabled: isHydrated && !!activeRelay && !!pubkey,
  });

  const firstPinnedItem = pinnedData?.pinnedArticles?.[0];
  const { data: pinnedBlog } = useQuery({
    queryKey: [
      "pinned-blog",
      activeRelay,
      firstPinnedItem?.pubkey,
      firstPinnedItem?.identifier,
    ],
    queryFn: () =>
      fetchBlogByAddress({
        pubkey: firstPinnedItem!.pubkey,
        identifier: firstPinnedItem!.identifier,
        relay: firstPinnedItem?.relay || activeRelay,
      }),
    enabled:
      isHydrated &&
      !!activeRelay &&
      !!firstPinnedItem?.pubkey &&
      !!firstPinnedItem?.identifier,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const filteredBlogs = pinnedBlog
    ? blogs.filter((blog) => blog.id !== pinnedBlog.id)
    : blogs;
  const countEventIds = [
    ...(pinnedBlog ? [pinnedBlog.id] : []),
    ...filteredBlogs
      .filter((blog) => blog.likeCount === undefined || blog.replyCount === undefined)
      .map((blog) => blog.id),
  ];
  const { getCounts, isLoading: isInteractionCountLoading } = useInteractionCounts(countEventIds);
  const { data: profile, isLoading: isLoadingProfile } = useProfile(pubkey);

  const { ref: loadMoreRef } = useInView({
    rootMargin: "200px",
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

  const handlePinArticle = async (blog: Blog) => {
    if (isPinning) return;
    
    if (!isOwnProfile) {
      toast.error("You can only pin articles on your own profile");
      return;
    }

    setIsPinning(true);
    try {
      const pinnedArticles = [
        {
          kind: 30023,
          pubkey: blog.pubkey,
          identifier: blog.dTag,
          relay: activeRelay,
        },
      ];

      const results = await publishPinnedArticles({
        pinnedArticles,
        relays,
        secretKey: viewer?.secretKey,
      });

      const successfulRelays = results.filter((r) => r.success);
      const successCount = successfulRelays.length;

      if (successCount > 0) {
        toast.success("Article pinned!", {
          description: `Pinned to ${successCount} relay${successCount !== 1 ? "s" : ""}`,
        });
        refetchPinnedData();
      } else {
        toast.error("Failed to pin article", {
          description: "Failed to pin to any relay",
        });
      }
    } catch (err) {
      console.error("Failed to pin article:", err);
      toast.error("Failed to pin article", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsPinning(false);
    }
  };

  const handleUnpinArticle = async () => {
    if (isPinning || !isOwnProfile) return;

    setIsPinning(true);
    try {
      const results = await publishPinnedArticles({
        pinnedArticles: [],
        relays,
        secretKey: viewer?.secretKey,
      });

      const successfulRelays = results.filter((r) => r.success);
      const successCount = successfulRelays.length;

      if (successCount > 0) {
        toast.success("Article unpinned!", {
          description: `Updated ${successCount} relay${successCount !== 1 ? "s" : ""}`,
        });
        refetchPinnedData();
      } else {
        toast.error("Failed to unpin article", {
          description: "Failed to update any relay",
        });
      }
    } catch (err) {
      console.error("Failed to unpin article:", err);
      toast.error("Failed to unpin article", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto w-full max-w-2xl">
          {!pubkey && (
            <div className="rounded-lg border border-border p-4 text-sm text-red-500">
              Invalid author id. Use a valid `npub` or `nprofile`.
            </div>
          )}

          {pubkey && (
            <section className="mb-6 border-b border-border/70 pb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {isLoadingProfile ? (
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile?.picture || generateAvatar(pubkey)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-foreground truncate">
                      {profile?.name || authorNpub}
                    </h1>
                    {authorNpub && (
                      <p className="mt-1 text-xs text-muted-foreground break-all">
                        {authorNpub}
                      </p>
                    )}
                    {profile?.nip05 && (
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {profile.nip05}
                      </p>
                    )}
                  </div>
                </div>
                {isOwnProfile && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="shrink-0"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit profile
                  </Button>
                )}
              </div>
            </section>
          )}

          {pubkey && isLoading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading articles...
            </div>
          )}

          {pubkey && isError && (
            <div className="p-4 text-center text-red-500 text-sm">
              Failed to load articles
            </div>
          )}

          {pubkey && !isLoading && !isError && blogs.length === 0 && !pinnedBlog && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No articles found
            </div>
          )}

          {pinnedBlog && (
            <div className="mb-6 pb-6 border-b border-border/70">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                <PinIcon className="w-3.5 h-3.5" />
                <span>Pinned article</span>
              </div>
              {(() => {
                const thumbnail = pinnedBlog.image || extractFirstImage(pinnedBlog.content);
                const readMinutes = estimateReadTime(
                  pinnedBlog.content || pinnedBlog.summary || "",
                );
                const naddr = blogToNaddr(pinnedBlog, relays);
                const interaction = getCounts(pinnedBlog.id);
                const likeCount = interaction?.likeCount ?? pinnedBlog.likeCount;
                const replyCount = interaction?.replyCount ?? pinnedBlog.replyCount;
                const isCountLoading =
                  isInteractionCountLoading(pinnedBlog.id) &&
                  likeCount === undefined &&
                  replyCount === undefined;

                return (
                  <div className="py-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="text-muted-foreground/70">
                        {formatDate(pinnedBlog.publishedAt || pinnedBlog.createdAt)}
                      </span>
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
                          <StackMenuSub blog={pinnedBlog} />
                          <DropdownMenuSeparator />
                          {isOwnProfile && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUnpinArticle();
                                }}
                                disabled={isPinning}
                              >
                                <PinIcon className="w-4 h-4" />
                                {isPinning ? "Unpinning..." : "Unpin article"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              downloadMarkdownFile(pinnedBlog.title, pinnedBlog.content || "");
                            }}
                          >
                            <DownloadIcon className="w-4 h-4" />
                            Download markdown
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              handleBroadcast(pinnedBlog, e);
                            }}
                            disabled={
                              broadcastingBlogId === pinnedBlog.id || !pinnedBlog.rawEvent
                            }
                          >
                            <SendIcon className="w-4 h-4" />
                            {broadcastingBlogId === pinnedBlog.id
                              ? "Broadcasting..."
                              : "Broadcast"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewJson(pinnedBlog.rawEvent);
                            }}
                            disabled={!pinnedBlog.rawEvent}
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
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-foreground">
                          {pinnedBlog.title || "Untitled"}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {pinnedBlog.summary}
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
                  </div>
                );
              })()}
            </div>
          )}

          <ul className="divide-y divide-border/60">
            {filteredBlogs.map((blog) => {
              const thumbnail = blog.image || extractFirstImage(blog.content);
              const readMinutes = estimateReadTime(
                blog.content || blog.summary || "",
              );
              const naddr = blogToNaddr(blog, relays);
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
                    <span className="text-muted-foreground/70">
                      {formatDate(blog.publishedAt || blog.createdAt)}
                    </span>
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
                        {isOwnProfile && (
                          <>
                            {pinnedBlog?.id === blog.id ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUnpinArticle();
                                }}
                                disabled={isPinning}
                              >
                                <PinIcon className="w-4 h-4" />
                                {isPinning ? "Unpinning..." : "Unpin article"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePinArticle(blog);
                                }}
                                disabled={isPinning}
                              >
                                <PinIcon className="w-4 h-4" />
                                {isPinning ? "Pinning..." : "Pin article"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
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
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-foreground">
                        {blog.title || "Untitled"}
                      </h2>
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

          {pubkey && hasNextPage && (
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
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        pubkey={pubkey}
      />
    </div>
  );
}
