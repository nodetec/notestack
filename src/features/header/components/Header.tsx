/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ThemeToggle } from "~/features/theme-toggle";
import { Layers3, PenBoxIcon } from "lucide-react";
import { Merriweather } from "next/font/google";
import Link from "next/link";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["700"],
});

export function Header() {
  return (
    <header className="relative flex items-center justify-between px-4 py-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Layers3 className="h-5 w-5" />
        <span
          className={`${merriweather.className} text-xl font-bold`}
        >
          NoteStack
        </span>
      </Link>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 transform items-center gap-4 md:flex">
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold hover:bg-primary/5"
          prefetch={false}
        >
          Home
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
          prefetch={false}
        >
          Inbox
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
          prefetch={false}
        >
          Stacks
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
          prefetch={false}
        >
          About
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <Button
          className="focus-visible:outline-none focus-visible:ring-transparent lg:hidden"
          variant="outline"
          size="icon"
        >
          <PenBoxIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
        <Button
          className="hidden focus-visible:outline-none focus-visible:ring-transparent lg:flex"
          variant="outline"
        >
          <PenBoxIcon className="mr-2 h-[1.2rem] w-[1.2rem]" />
          <span className="text-[1.05rem]">Write</span>
        </Button>

        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full focus-visible:ring-muted"
            >
              <img
                src="https://chrisatmachine.com/images/me.jpg"
                alt="Avatar"
                className="overflow-hidden rounded-full object-cover"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[12rem] rounded-lg p-3"
            align="end"
          >
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
      </div>
    </header>
  );
}
