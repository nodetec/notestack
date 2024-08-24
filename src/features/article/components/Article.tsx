"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { processArticle, readingTime } from "~/lib/markdown";
import {
  getAllReadRelays,
  getEvent,
  getProfile,
  getProfileEvent,
  getTag,
  profileContent,
  shortNpub,
} from "~/lib/nostr";
import { formatEpochTime, getAvatar } from "~/lib/utils";
import { useAppState } from "~/store";
import { type Profile } from "~/types";
import Image from "next/image";
import { type AddressPointer } from "nostr-tools/nip19";

import { ArticleHeader } from "./ArticleHeader";
import { SkeletonArticle } from "./SkeletonArticle";

type Props = {
  address: AddressPointer;
  publicKey: string | undefined;
};

const getCurrentArticle = async (
  address: AddressPointer,
  publicKey: string | undefined,
) => {
  const articleMap = useAppState.getState().articleMap;

  if (articleMap.has(address.identifier + address.pubkey)) {
    console.log("Article found in cache");
    return articleMap.get(address.identifier + address.pubkey);
  }

  const filter = {
    kinds: [address.kind],
    limit: 1,
    "#d": [address.identifier],
  };

  let relays = address.relays;

  if (!relays) {
    relays = await getAllReadRelays(publicKey);
  }

  const event = await getEvent(filter, relays);

  if (!event) {
    console.error("Event not found");
    throw new Error("Event not found");
  }

  return event;
};

export function Article({ address, publicKey }: Props) {
  const { data: articleEvent, status } = useQuery({
    queryKey: ["article", address.pubkey, address.identifier],
    refetchOnWindowFocus: false,
    retry: 0,
    queryFn: () => getCurrentArticle(address, publicKey),
  });

  const { data: profile, status: profileStatus } = useQuery<Profile>({
    queryKey: ["profile", articleEvent?.pubkey],
    refetchOnWindowFocus: false,
    enabled: !!articleEvent,
    queryFn: () =>
      getProfile(address.relays ?? DEFAULT_RELAYS, articleEvent?.pubkey),
  });

  if (status === "pending" || profileStatus === "pending") {
    return <SkeletonArticle />;
  }

  if (status === "error") {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <>
      {status === "success" && articleEvent && (
        <>
          <ArticleHeader
            address={address}
            publicKey={publicKey}
            articleEvent={articleEvent}
          />
          <div className="mx-auto mb-8 flex max-w-[65ch] flex-col gap-8 border-b pb-8">
            <div className="prose prose-zinc dark:prose-invert">
              <h1>{getTag("title", articleEvent.tags)}</h1>
            </div>

            <div className="flex items-center gap-4">
              <Image
                className="aspect-square w-10 overflow-hidden rounded-full object-cover"
                src={profile?.picture ?? getAvatar(address.pubkey)}
                width={32}
                height={32}
                alt=""
              />
              <div className="flex flex-col gap-1">
                <div>{profile?.name ?? shortNpub(address.pubkey)}</div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>{readingTime(articleEvent?.content)}</span>
                  <span>•</span>
                  <span>{formatEpochTime(articleEvent.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <article
            className="prose prose-zinc mx-auto dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: processArticle(articleEvent),
            }}
          />
        </>
      )}
    </>
  );
}
