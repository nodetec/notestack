"use client";

import { useRelayMetadataEvent } from "~/hooks/useRelayMetadataEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";

import { type ArticleFeedParams } from "../hooks/useArticleFeed";
import { ArticleFeed } from "./ArticleFeed";

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

  console.log("profileRelayMetadataEvent", profileRelayMetadataEvent);

  const articleFeedParams: ArticleFeedParams = {
    enabled: profileRelayMetadataEvent?.status === "success",
    profilePublicKey,
    userFollowEvent: undefined,
    profileRelayMetadataEvent: profileRelayMetadataEvent.data,
    nip05HintRelays: nip05HintRelays ?? [],
  };

  return <ArticleFeed articleFeedParams={articleFeedParams} />;
}
