import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/features/theme-toggle";
import { Layers3, PenBoxIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProfileDropdown } from "./ProfileDropdown";

export function Header() {
  return (
    <header className="relative flex items-center justify-between px-4 py-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Layers3 className="h-5 w-5" />
        <span className="font-merriweather text-xl font-bold">NoteStack</span>
      </Link>
      <nav className="absolute left-1/2 hidden -translate-x-1/2 transform items-center gap-4 md:flex">
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold hover:bg-primary/5"
        >
          Home
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
        >
          Inbox
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
        >
          Stacks
        </Link>
        <Link
          href="#"
          className="rounded-md px-2 py-2 font-semibold text-primary/80 hover:bg-primary/5"
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
        <ProfileDropdown>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full focus-visible:ring-muted"
          >
            <Image
              className="overflow-hidden rounded-full object-cover"
              src="https://chrisatmachine.com/images/me.jpg"
              width={100}
              height={100}
              alt=""
            />
          </Button>
        </ProfileDropdown>
      </div>
    </header>
  );
}
