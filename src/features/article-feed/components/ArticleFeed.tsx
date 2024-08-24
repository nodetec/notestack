"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getReadRelays } from "~/lib/nostr";
import { toast } from "sonner";

import { ArticleCard } from "./ArticleCard";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  publicKey: string | undefined;
};

// @ts-expect-error HACK: idk what to use as a type here
const fetchArticles = async ({ pageParam = 0, queryKey }: unknown) => {
  // cast queryKey to string[] to avoid TS error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const relays = queryKey[1] as string[];
  console.log("RELAYS", relays);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const response = await getArticles(relays, pageParam);
  if (response.articles.length === 0) {
    toast("No more articles to load", {
      description: "You've reached the end of the feed. Try another relay.",
    });
  }
  return response;
};

export function ArticleFeed({ publicKey }: Props) {
  const { data: userReadRelays, status: userReadRelaysStatus } = useQuery({
    queryKey: ["userReadRelays"],
    refetchOnWindowFocus: false,
    queryFn: () => getReadRelays(publicKey, DEFAULT_RELAYS),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["articles", userReadRelays],
      queryFn: fetchArticles,
      refetchOnWindowFocus: false,
      gcTime: Infinity,
      initialPageParam: 0,
      enabled: !!userReadRelays?.length,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  if (userReadRelaysStatus === "pending" || status === "pending") {
    return <SkeletonArticleFeed />;
  }

  if (userReadRelaysStatus === "error" || status === "error") {
    return <div>Error fetching articles</div>;
  }

  return (
    <>
      {status === "success" && userReadRelaysStatus === "success" && (
        <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
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
