/* eslint-disable @next/next/no-img-element */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getProfileEvent, profileContent, shortNpub } from "~/lib/nostr";
import { useAppState } from "~/store";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getAvatar } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";

type Props = {
  publicKey: string | undefined;
};

export function ProfileDropdown({ publicKey }: Props) {
  const relays = useAppState((state) => state.relays);

  const { data: profileEvent, isFetching } = useQuery({
    queryKey: ["userProfile"],
    refetchOnWindowFocus: false,
    queryFn: () => getProfileEvent(relays, publicKey),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full focus-visible:ring-muted"
        >
          {isFetching ? (
            <Skeleton className="aspect-square w-12 overflow-hidden rounded-full object-cover" />
          ) : (
            <Image
              className="aspect-square w-12 overflow-hidden rounded-full object-cover"
              src={profileContent(profileEvent)?.picture ?? getAvatar(publicKey)}
              width={48}
              height={48}
              alt=""
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[12rem] rounded-lg p-2" align="end">
        <DropdownMenuItem className="mb-2 cursor-pointer text-[1rem] font-medium">
          {profileContent(profileEvent)?.name ?? shortNpub(publicKey)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="my-2 cursor-pointer text-[1rem] font-medium"
        >
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium"> */}
        {/*   Inbox */}
        {/* </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium"> */}
        {/*   Stacks */}
        {/* </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="mt-2 cursor-pointer text-[1rem] font-medium"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
