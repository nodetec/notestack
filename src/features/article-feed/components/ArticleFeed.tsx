"use client";

import { useFollowEvent } from "~/hooks/useFollowEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";

import { useArticleFeed } from "../hooks/useArticleFeed";
import { ArticleCard } from "./ArticleCard";
import { ArticleFeedControls } from "./ArticleFeedControls";
import ArticleFeedProfile from "./ArticleFeedProfile";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
  profilePublicKey?: string;
};

export function ArticleFeed({ userPublicKey, profilePublicKey }: Props) {
  const relays = DEFAULT_RELAYS;

  const { data: userFollowEvent } = useFollowEvent(userPublicKey, relays);

  const {
    data: articleEvents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useArticleFeed(profilePublicKey, userFollowEvent);

  if (status === "pending") {
    return <SkeletonArticleFeed profileFeed={!!profilePublicKey} />;
  }

  if (status === "error") {
    return <div>Error fetching articles</div>;
  }

  if (status === "success") {
    return (
      <div className="min-w-3xl mx-auto flex w-full max-w-3xl flex-col items-center gap-y-4">
        {profilePublicKey && (
          <ArticleFeedProfile relays={relays} publicKey={profilePublicKey} />
        )}
        <ArticleFeedControls show={!profilePublicKey} />
        {articleEvents.pages.flatMap((page) =>
          page.articles.map((event) => (
            <ArticleCard key={event.id} articleEvent={event} relays={relays} />
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
}
