"use client";

import { useMemo } from "react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { useProfileEvent } from "~/hooks/useProfileEvent";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { parseProfileEvent } from "~/lib/events/profile-event";
import { createProfileLink, shortNpub } from "~/lib/nostr";
import { getAvatar } from "~/lib/utils";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  publicKey: string;
};

export function ProfileDropdown({ publicKey }: Props) {
  const { data: profileEvent, status } = useProfileEvent(
    DEFAULT_RELAYS,
    publicKey,
  );

  const profile = useMemo(
    () => (profileEvent ? parseProfileEvent(profileEvent) : null),
    [profileEvent],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full focus-visible:ring-muted"
        >
          {status === "pending" ? (
            <Skeleton className="aspect-square w-12 overflow-hidden rounded-full object-cover" />
          ) : (
            <Image
              className="aspect-square w-12 overflow-hidden rounded-full object-cover"
              src={profile?.content?.picture ?? getAvatar(publicKey)}
              width={48}
              height={48}
              alt=""
              loading="lazy"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={createProfileLink(profile, publicKey)} prefetch={false}>
            {profile?.content?.name ?? shortNpub(publicKey)}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" prefetch={false}>
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/relays" prefetch={false}>
            Relays
          </Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium"> */}
        {/*   Stacks */}
        {/* </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
