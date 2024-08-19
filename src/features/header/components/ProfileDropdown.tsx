/* eslint-disable @next/next/no-img-element */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function ProfileDropdown({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[12rem] rounded-lg p-3" align="end">
        <DropdownMenuItem className="text-[1rem] font-medium">
          chris@nostrings.news
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[1rem] font-medium">
          Home
        </DropdownMenuItem>
        <DropdownMenuItem className="text-[1rem] font-medium">
          Inbox
        </DropdownMenuItem>
        <DropdownMenuItem className="text-[1rem] font-medium">
          Stacks
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[1rem] font-medium">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
