"use client";

import { DEFAULT_RELAYS } from "~/lib/constants";

import {
  useArticleFeed,
  type ArticleFeedParams,
} from "../hooks/useArticleFeed";
import { ArticleCard } from "./ArticleCard";
import { ArticleFeedControls } from "./ArticleFeedControls";
import ArticleFeedProfile from "./ArticleFeedProfile";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  articleFeedParams: ArticleFeedParams;
};

export function ArticleFeed({ articleFeedParams }: Props) {
  const {
    data: articleEvents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useArticleFeed(articleFeedParams);

  if (status === "pending") {
    return (
      <SkeletonArticleFeed profileFeed={!!articleFeedParams.profilePublicKey} />
    );
  }

  if (status === "error") {
    return <div>Error fetching articles</div>;
  }

  return (
    <div className="min-w-3xl mx-auto flex w-full max-w-3xl flex-col items-center gap-y-4">
      {articleFeedParams.profilePublicKey && (
        <ArticleFeedProfile
          relays={DEFAULT_RELAYS}
          publicKey={articleFeedParams.profilePublicKey}
        />
      )}
      <ArticleFeedControls show={!articleFeedParams.profilePublicKey} />
      {articleEvents.pages.flatMap((page) =>
        page.articles.map((event) => (
          <ArticleCard
            key={event.id}
            articleEvent={event}
            relays={DEFAULT_RELAYS}
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
  );
}
