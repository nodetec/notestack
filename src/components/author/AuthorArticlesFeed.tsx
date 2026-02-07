"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  MoreHorizontalIcon,
  DownloadIcon,
  SendIcon,
  CodeIcon,
  PencilIcon,
} from "lucide-react";
import { nip19 } from "nostr-tools";
import { useSession } from "next-auth/react";
import { fetchBlogs } from "@/lib/nostr/fetch";
import { broadcastEvent } from "@/lib/nostr/publish";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useProfile } from "@/lib/hooks/useProfiles";
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
  const profileRelays = useMemo(
    () => [...new Set([activeRelay, ...relays].filter(Boolean))],
    [activeRelay, relays],
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
        limit: 20,
        until: pageParam,
        relay: activeRelay,
        pubkey: pubkey!,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isHydrated && !!activeRelay && !!pubkey,
  });

  const blogs = data?.pages.flatMap((page) => page.blogs) ?? [];
  const { data: profile, isLoading: isLoadingProfile } = useProfile(
    pubkey,
    profileRelays,
  );

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

          {pubkey && !isLoading && !isError && blogs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No articles found
            </div>
          )}

          <ul className="divide-y divide-border/60">
            {blogs.map((blog) => {
              const thumbnail = blog.image || extractFirstImage(blog.content);
              const readMinutes = estimateReadTime(
                blog.content || blog.summary || "",
              );
              const naddr = blogToNaddr(blog, relays);

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
                      </div>
                    </div>
                    {thumbnail && (
                      <div className="shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-md overflow-hidden bg-muted">
                        {/*eslint-disable-next-line @next/next/no-img-element*/}
                        <img
                          src={thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
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
