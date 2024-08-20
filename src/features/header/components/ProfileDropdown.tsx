/* eslint-disable @next/next/no-img-element */
"use client";

import { useQuery } from "@tanstack/react-query";
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
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  publicKey: string | undefined;
};

export function ProfileDropdown({ children, publicKey }: Props) {
  const relays = useAppState((state) => state.relays);

  const { data } = useQuery({
    queryKey: ["userProfile"],
    refetchOnWindowFocus: false,
    queryFn: () => getProfileEvent(relays, publicKey),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[12rem] rounded-lg p-2" align="end">
        <DropdownMenuItem className="mb-2 cursor-pointer text-[1rem] font-medium">
          {profileContent(data)?.name ?? shortNpub(publicKey)}
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
