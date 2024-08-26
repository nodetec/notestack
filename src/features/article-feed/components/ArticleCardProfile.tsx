import React from "react";

import { Skeleton } from "~/components/ui/skeleton";
import { type Profile } from "~/lib/events/profile-event";
import { createProfileLink, shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import Image from "next/image";
import Link from "next/link";

type Props = {
  profile: Profile | undefined;
  publicKey: string;
  isFetching: boolean;
};

export function ArticleCardProfile({ profile, publicKey, isFetching }: Props) {
  return (
    <>
      {isFetching ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="aspect-square w-5 overflow-hidden rounded-full object-cover" />
          <Skeleton className="h-4 w-20" />
        </div>
      ) : (
        <Link
          className="flex items-center gap-2 text-sm text-muted-foreground"
          href={createProfileLink(profile, publicKey)}
        >
          <Image
            className="aspect-square w-5 overflow-hidden rounded-full object-cover hover:brightness-90"
            src={profile?.content.picture ?? getAvatar(publicKey)}
            width={48}
            height={48}
            alt=""
          />
          <span className="hover:underline">
            {profile?.content.name ?? shortNpub(publicKey)}
          </span>
        </Link>
      )}
    </>
  );
}
