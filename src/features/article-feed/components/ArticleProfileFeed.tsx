"use client";

import { useMemo } from "react";

import { useRelayMetadataEvent } from "~/hooks/useRelayMetadataEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseRelayMetadataEvent } from "~/lib/events/relay-metadata-event";

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
  const { data: profileRelayMetadataEvent } = useRelayMetadataEvent(
    profilePublicKey,
    DEFAULT_RELAYS,
  );

  console.log("profileRelayMetadataEvent", profileRelayMetadataEvent);

  const articleFeedParams: ArticleFeedParams = {
    enabled: profileRelayMetadataEvent !== undefined,
    profilePublicKey,
    userFollowEvent: undefined,
    profileRelayMetadataEvent: profileRelayMetadataEvent,
    nip05HintRelays: nip05HintRelays ?? [],
  };

  return <ArticleFeed articleFeedParams={articleFeedParams} />;
}
