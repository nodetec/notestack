"use client";

import { useFollowEvent } from "~/hooks/useFollowEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";

import { type ArticleFeedParams } from "../hooks/useArticleFeed";
import { ArticleFeed } from "./ArticleFeed";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
};

export function ArticleHomeFeed({ userPublicKey }: Props) {
  const userFollowEvent = useFollowEvent(userPublicKey, DEFAULT_RELAYS);

  const articleFeedParams: ArticleFeedParams = {
    enabled: userFollowEvent !== undefined,
    profilePublicKey: undefined,
    userFollowEvent: userFollowEvent.data,
    profileRelayMetadataEvent: undefined,
    nip05HintRelays: [],
  };

  return (
    <>
      {userFollowEvent.status === "pending" ? (
        <SkeletonArticleFeed />
      ) : (
        <ArticleFeed articleFeedParams={articleFeedParams} />
      )}
    </>
  );
}
