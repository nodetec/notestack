"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Badge } from "~/components/ui/badge";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getFollowEvent, getTag } from "~/lib/nostr";
import { useAppState } from "~/store";
import { useRouter, useSearchParams } from "next/navigation";
import type { Event } from "nostr-tools";

import { ArticleCard } from "./ArticleCard";
import { ArticleFeedControls } from "./ArticleFeedControls";
import ArticleFeedProfile from "./ArticleFeedProfile";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
  profilePublicKey?: string;
};

// @ts-expect-error HACK: idk what to use as a type here
const fetchArticles = async ({ pageParam = 0, queryKey }: unknown) => {
  console.log("fetchArticles", pageParam, queryKey);
  // cast queryKey to string[] to avoid TS error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const relays = queryKey[1] as string[];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const publicKey = queryKey[2] as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const followEvent = queryKey[3] as Event;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const feed = queryKey[4] as string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const response = await getArticles(
    relays,
    pageParam,
    publicKey,
    followEvent,
    feed,
  );

  const addArticle = useAppState.getState().addArticle;

  response.articles.forEach((article) => {
    const identifier = getTag("d", article.tags);
    const publicKey = article.pubkey;
    const id = identifier + publicKey;
    addArticle(id, article);
  });

  return response;
};

export function ArticleFeed({ userPublicKey, profilePublicKey }: Props) {
  // const { data: userReadRelays, status: userReadRelaysStatus } = useQuery({
  //   queryKey: ["userReadRelays"],
  //   refetchOnWindowFocus: false,
  //   queryFn: () =>
  //     profilePublicKey
  //       ? getWriteRelays(profilePublicKey, DEFAULT_RELAYS)
  //       : getReadRelays(userPublicKey, DEFAULT_RELAYS),
  // });

  const searchParams = useSearchParams();

  const userReadRelays = DEFAULT_RELAYS;

  const { data: userfollowEvent, status: userFollowEventStatus } = useQuery({
    queryKey: ["followList", userPublicKey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: Infinity,
    staleTime: Infinity,
    queryFn: () => getFollowEvent(userReadRelays, userPublicKey),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: [
        "articles",
        userReadRelays,
        profilePublicKey,
        userfollowEvent,
        searchParams.get("feed"),
      ],
      queryFn: fetchArticles,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      gcTime: Infinity,
      staleTime: Infinity,
      initialPageParam: 0,
      enabled: !!userfollowEvent,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  if (status === "pending") {
    // if (userReadRelaysStatus === "pending" || status === "pending") {
    return <SkeletonArticleFeed profileFeed={!!profilePublicKey} />;
  }

  if (status === "error") {
    // if (userReadRelaysStatus === "error" || status === "error") {
    return <div>Error fetching articles</div>;
  }

  return (
    <div className="flex w-full flex-col items-center border border-blue-500">
      {status === "success" && (
        <div className="mx-auto flex w-full justify-between max-w-6xl border border-red-500">
          <div className="min-w-3xl flex w-full max-w-3xl flex-col items-center gap-y-4">
            {profilePublicKey && (
              <ArticleFeedProfile
                relays={userReadRelays}
                publicKey={profilePublicKey}
              />
            )}
            <ArticleFeedControls show={!profilePublicKey} />
            {data.pages.flatMap((page) =>
              page.articles.map((event) => (
                <ArticleCard
                  key={event.id}
                  event={event}
                  relays={userReadRelays}
                />
              )),
            )}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
              >
                Load More
              </button>
            )}
          </div>
          <div className="pt-6 flex-col gap-4 hidden lg:flex">
            <h2 className="text-lg font-semibold text-foreground/80">
              Recommended Topics
            </h2>
            <div className="sticky top-6 max-w-80 flex-wrap gap-4 flex border-green-500">
              <Badge>java</Badge>
              <Badge>nostr</Badge>
              <Badge>lightning</Badge>
              <Badge>bitcoin</Badge>
              <Badge>Golang</Badge>
              <Badge>Rust</Badge>
              <Badge>Tailwind</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
