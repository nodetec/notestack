"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type Props = {
  children: React.ReactNode;
};

export function ArticleFeedFilterDropdown({ children }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Featured</DropdownMenuItem>
        <DropdownMenuItem>Following</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
