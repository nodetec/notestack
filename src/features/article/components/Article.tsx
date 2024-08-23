"use client";

import { useQuery } from "@tanstack/react-query";
import { processContent } from "~/lib/markdown";
import { getAllReadRelays, getEvent } from "~/lib/nostr";
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
    queryFn: () => getCurrentArticle(address, publicKey),
  });

  if (status === "pending") {
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
          <article
            className="prose prose-zinc mx-auto dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: processContent(articleEvent.content),
            }}
          />
        </>
      )}
    </>
  );
}
