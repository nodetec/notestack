"use client";

import {
  type QueryFunctionContext,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getArticles, getFollowEvent, getTag } from "~/lib/nostr";
import { useAppState } from "~/store";
import { useSearchParams } from "next/navigation";
import type { Event } from "nostr-tools";
import { toast } from "sonner";

import { ArticleCard } from "./ArticleCard";
import { ArticleFeedControls } from "./ArticleFeedControls";
import ArticleFeedProfile from "./ArticleFeedProfile";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
  profilePublicKey?: string;
};

const fetchArticles = async ({
  pageParam = 0,
  queryKey,
}: QueryFunctionContext) => {
  console.log("fetchArticles", pageParam, queryKey);
  const page = (pageParam as number) || 0;
  const relays = queryKey[1] as string[];
  const publicKey = queryKey[2] as string;
  const followEvent = queryKey[3] as Event;
  const feed = queryKey[4] as string;
  const response = await getArticles(
    relays,
    page,
    publicKey,
    followEvent,
    feed,
  );

  const addArticle = useAppState.getState().addArticle;

  if (response.articles.length === 0) {
    toast("You've reached the end", {
      description: "No more articles found",
    });
  }

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
    <>
      {status === "success" && (
        // {status === "success" && userReadRelaysStatus === "success" && (
        <div className="min-w-3xl mx-auto flex w-full max-w-3xl flex-col items-center gap-y-4">
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
      )}
    </>
  );
}
