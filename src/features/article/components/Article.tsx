"use client";

import { useMemo } from "react";

import { Button } from "~/components/ui/button";
import { ZapDialog } from "~/components/ZapDialog";
import useAuth from "~/hooks/useAuth";
import { useProfileEvent } from "~/hooks/useProfileEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { processArticle, readingTime } from "~/lib/markdown";
import { getTag, shortNpub } from "~/lib/nostr";
import { formatEpochTime, getAvatar } from "~/lib/utils";
import { ZapIcon } from "lucide-react";
import Image from "next/image";
import { type AddressPointer } from "nostr-tools/nip19";

import { useArticleEvent } from "../hooks/useArticleEvent";
import { ArticleHeader } from "./ArticleHeader";
import { SkeletonArticle } from "./SkeletonArticle";

// import useAuth from "~/hooks/useAuth";

type Props = {
  address: AddressPointer;
};

export function Article({ address }: Props) {
  // look into react query select to parse data
  const { data: articleEvent, status } = useArticleEvent(
    address,
    address.pubkey,
  );

  const { data: profileEvent, status: profileEventStatus } = useProfileEvent(
    address.relays ?? DEFAULT_RELAYS,
    articleEvent?.pubkey,
  );

  const profile = useMemo(
    () => (profileEvent ? parseProfileEvent(profileEvent) : null),
    [profileEvent],
  );

  const { userPublicKey } = useAuth();

  if (status === "pending" || profileEventStatus === "pending") {
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
          <ArticleHeader address={address} articleEvent={articleEvent} />
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
                  loading="lazy"
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
                <ZapDialog
                  recipientProfileEvent={profile?.event}
                  senderPubkey={userPublicKey}
                >
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
