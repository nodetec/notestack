"use client";

import { useRelayMetadataEvent } from "~/hooks/useRelayMetadataEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";

import { type ArticleFeedParams } from "../hooks/useArticleFeed";
import { ArticleFeed } from "./ArticleFeed";
import { SkeletonArticleFeed } from "./SkeletonArticleFeed";

type Props = {
  userPublicKey: string | undefined;
  profilePublicKey?: string;
  nip05HintRelays?: string[];
};

export function ArticleProfileFeed({
  userPublicKey,
  profilePublicKey,
  nip05HintRelays,
}: Props) {
  const profileRelayMetadataEvent = useRelayMetadataEvent(
    profilePublicKey,
    DEFAULT_RELAYS,
  );

  const articleFeedParams: ArticleFeedParams = {
    enabled: profileRelayMetadataEvent.isSuccess,
    profilePublicKey,
    userFollowEvent: undefined,
    profileRelayMetadataEvent: profileRelayMetadataEvent.data,
    nip05HintRelays: nip05HintRelays ?? [],
  };

  return (
    <>
      {profileRelayMetadataEvent.status === "pending" ? (
        <SkeletonArticleFeed profileFeed />
      ) : (
        <ArticleFeed articleFeedParams={articleFeedParams} />
      )}
    </>
  );
}
