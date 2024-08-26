"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { ZapDialog } from "~/components/ZapDialog";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { processArticle, readingTime } from "~/lib/markdown";
import { getEvent, getProfileEvent, getTag, shortNpub } from "~/lib/nostr";
import { formatEpochTime, getAvatar } from "~/lib/utils";
import { useAppState } from "~/store";
import { ZapIcon } from "lucide-react";
import Image from "next/image";
import { type Event } from "nostr-tools";
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

  console.log("ArticleMap", articleMap);

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
    // relays = await getAllReadRelays(publicKey);
    relays = DEFAULT_RELAYS;
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
    queryFn: () => getCurrentArticle(address, publicKey),
  });

  const { data: profileEvent, status: profileStatus } = useQuery<Event | null>({
    queryKey: ["profile", articleEvent?.pubkey],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!articleEvent,
    queryFn: () =>
      getProfileEvent(address.relays ?? DEFAULT_RELAYS, articleEvent?.pubkey),
  });

  let profile;

  if (profileEvent) {
    profile = parseProfileEvent(profileEvent);
  }

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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  className="aspect-square w-10 overflow-hidden rounded-full object-cover"
                  src={profile?.content.picture ?? getAvatar(address.pubkey)}
                  width={32}
                  height={32}
                  alt=""
                />
                <div className="flex flex-col gap-1">
                  <div>
                    {profile?.content.name ?? shortNpub(address.pubkey)}
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{readingTime(articleEvent?.content)}</span>
                    <span>•</span>
                    <span>{formatEpochTime(articleEvent.created_at)}</span>
                  </div>
                </div>
              </div>

              <ZapDialog>
                <Button
                  className="hover:bg-muted/80 hover:text-yellow-500 focus-visible:outline-none focus-visible:ring-transparent"
                  variant="ghost"
                  size="icon"
                >
                  <ZapIcon className="h-5 w-5" />
                </Button>
              </ZapDialog>
            </div>
          </div>

          <article
            className="break-anywhere prose prose-zinc mx-auto dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: processArticle(articleEvent),
            }}
          />
        </>
      )}
    </>
  );
}
