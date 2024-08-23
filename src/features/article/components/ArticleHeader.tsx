"use client";

import React from "react";

import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, EllipsisVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { type AddressPointer } from "nostr-tools/nip19";

import { ArticleDropdown } from "./ArticleDropdown";
import { type Event } from "nostr-tools";

type Props = {
  address: AddressPointer;
  publicKey: string | undefined;
  articleEvent: Event;
};

export const ArticleHeader = ({ address, publicKey, articleEvent }: Props) => {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 mx-auto mb-6 flex max-w-2xl justify-between bg-secondary/95 pb-2 pt-4 backdrop-blur transition-colors duration-500 sm:px-2">
      <Button
        onClick={() => router.back()}
        className="bg-muted hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-transparent"
        variant="secondary"
        size="icon"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </Button>
      <ArticleDropdown address={address} publicKey={publicKey} articleEvent={articleEvent}>
        <Button
          className="bg-muted hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-transparent"
          variant="secondary"
          size="icon"
        >
          <EllipsisVertical className="h-5 w-5" />
        </Button>
      </ArticleDropdown>
    </div>
  );
};
