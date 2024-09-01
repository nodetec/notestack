"use client";

import { DEFAULT_RELAYS } from "~/lib/constants";
import { useInView } from "react-intersection-observer";

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

const isLastArticle = (
  pageIndex: number,
  articleIndex: number,
  totalPages: number,
  totalArticlesInPage: number,
): boolean => {
  return (
    pageIndex === totalPages - 1 && articleIndex === totalArticlesInPage - 1
  );
};

export function ArticleFeed({ articleFeedParams }: Props) {
  const {
    data: articleEvents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useArticleFeed(articleFeedParams);

  // Use useInView to create a ref and track visibility of the last article
  const { ref } = useInView({
    threshold: 0.1, // Adjust threshold as needed
    triggerOnce: false, // Continue observing
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
  });

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
      {articleEvents.pages.flatMap((page, pageIndex) =>
        page.articles.map((event, articleIndex) => (
          <ArticleCard
            articleEvent={event}
            relays={DEFAULT_RELAYS}
            key={event.id}
            ref={
              isLastArticle(
                pageIndex,
                articleIndex,
                articleEvents.pages.length,
                page.articles.length,
              )
                ? ref
                : undefined
            }
          />
        )),
      )}
    </div>
  );
}
