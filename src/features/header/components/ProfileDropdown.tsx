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
import useAuth from "~/hooks/useAuth";
import { getProfile } from "~/lib/nostr";
import { useAppState } from "~/store";
import { signOut } from "next-auth/react";

export function ProfileDropdown({ children }: { children: React.ReactNode }) {
  const { publicKey } = useAuth();

  const pool = useAppState((state) => state.pool);
  const relays = useAppState((state) => state.relays);

  const { data } = useQuery({
    queryKey: ["userProfile"],
    refetchOnWindowFocus: false,
    queryFn: () => getProfile(pool, relays, publicKey),
  });

  console.log(data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[12rem] rounded-lg p-2" align="end">
        <DropdownMenuItem className="mb-2 cursor-pointer text-[1rem] font-medium">
          {data?.name}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium">
          Home
        </DropdownMenuItem>
        <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium">
          Inbox
        </DropdownMenuItem>
        <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium">
          Stacks
        </DropdownMenuItem>
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
