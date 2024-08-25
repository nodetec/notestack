"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getReadRelays, getWriteRelays } from "~/lib/nostr";

import { ArticleCard } from "./ArticleCard";
import ArticleFeedProfile from "./ArticleFeedProfile";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
  profilePublicKey?: string;
};

// @ts-expect-error HACK: idk what to use as a type here
const fetchArticles = async ({ pageParam = 0, queryKey }: unknown) => {
  // cast queryKey to string[] to avoid TS error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const relays = queryKey[1] as string[];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const publicKey = queryKey[2] as string;
  console.log("RELAYS", relays);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const response = await getArticles(relays, pageParam, publicKey);
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

  const userReadRelays = DEFAULT_RELAYS;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["articles", userReadRelays, profilePublicKey],
      queryFn: fetchArticles,
      refetchOnWindowFocus: false,
      gcTime: Infinity,
      initialPageParam: 0,
      enabled: !!userReadRelays?.length,
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
    <>
      {status === "success" && (
        // {status === "success" && userReadRelaysStatus === "success" && (
        <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
          {profilePublicKey && (
            <ArticleFeedProfile
              relays={userReadRelays}
              publicKey={profilePublicKey}
            />
          )}
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
      )}
    </>
  );
}
