"use client";

import { useFollowEvent } from "~/hooks/useFollowEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";

import { type ArticleFeedParams } from "../hooks/useArticleFeed";
import { ArticleFeed } from "./ArticleFeed";

type Props = {
  userPublicKey: string | undefined;
};

export function ArticleHomeFeed({ userPublicKey }: Props) {
  const { data: userFollowEvent } = useFollowEvent(
    userPublicKey,
    DEFAULT_RELAYS,
  );

  const articleFeedParams: ArticleFeedParams = {
    enabled: userFollowEvent !== undefined,
    profilePublicKey: undefined,
    userFollowEvent,
    profileRelayMetadataEvent: undefined,
    nip05HintRelays: [],
  };

  return <ArticleFeed articleFeedParams={articleFeedParams} />;
}
