"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getReadRelays } from "~/lib/nostr";

import { ArticleCard } from "./ArticleCard";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  publicKey: string | undefined;
};

export function ArticleFeed({ publicKey }: Props) {
  const { data: userReadRelays } = useQuery({
    queryKey: ["userReadRelays"],
    refetchOnWindowFocus: false,
    queryFn: () => getReadRelays(publicKey, DEFAULT_RELAYS),
  });

  const relays =
    userReadRelays && userReadRelays.length > 0
      ? userReadRelays
      : DEFAULT_RELAYS;

  // const relays = DEFAULT_RELAYS;

  // @ts-expect-error HACK: idk what to use as a type here
  const fetchArticles = async ({ pageParam = 0, queryKey }: unknown) => {
    // cast queryKey to string[] to avoid TS error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const relays = queryKey[1] as string[];
    console.log("RELAYS", relays);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await getArticles(relays, pageParam);
    return response;
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["articles", relays],
      queryFn: fetchArticles,
      refetchOnWindowFocus: false,
      gcTime: Infinity,
      initialPageParam: 0,
      enabled: !!relays.length,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  if (status === "pending") {
    return <SkeletonArticleFeed />;
  }

  return (
    <>
      {status === "error" && <p>Error loading articles</p>}
      {status === "success" && (
        <div className="min-w-3xl mx-auto mt-12 flex w-full max-w-3xl flex-col items-center gap-y-4">
          {data.pages.flatMap((page) =>
            page.articles.map((event) => (
              <ArticleCard key={event.id} event={event} relays={relays} />
            )),
          )}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700"
            >
              {isFetchingNextPage ? "Loading more..." : "Load More"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
