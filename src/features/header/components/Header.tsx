import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { authOptions } from "~/auth";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/features/theme-toggle";
import { getProfileEvent } from "~/lib/nostr";
import { type UserWithKeys } from "~/types";
import { Layers3, PenBoxIcon } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { type Event } from "nostr-tools";

import { LoginButton } from "./LoginButton";
import { ProfileDropdown } from "./ProfileDropdown";

export async function Header() {
  const session = await getServerSession(authOptions);
  // const queryClient = new QueryClient();
  // const relays = ["wss://relay.notestack.com"];
  const user = session?.user as UserWithKeys | undefined;

  const publicKey = user?.publicKey;

  // let profileEvent: Event | undefined = undefined;

  // if (user) {
  //   profileEvent = await getProfileEvent(relays, user.publicKey);
  //
  //   await queryClient.prefetchQuery({
  //     queryKey: ["userProfile"],
  //     queryFn: async () => profileEvent,
  //   });
  // }

  return (
    <header className="relative flex items-center justify-between border-b px-6 py-4 sm:border-none lg:px-8">
      <Link href="/" className="flex items-center gap-2">
        <Layers3 className="h-5 w-5" />
        <span className="font-merriweather text-xl font-bold">NoteStack</span>
      </Link>
      <div className="flex items-center gap-4">
        {session && (
          <>
            <Link href="/write">
              <Button
                className="focus-visible:outline-none focus-visible:ring-transparent sm:flex lg:hidden"
                variant="outline"
                size="icon"
              >
                <PenBoxIcon className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </Link>
            <Link href="/write">
              <Button
                className="hidden focus-visible:outline-none focus-visible:ring-transparent lg:flex"
                variant="outline"
              >
                <PenBoxIcon className="mr-2 h-[1.2rem] w-[1.2rem]" />
                <span className="text-[1.05rem]">Write</span>
              </Button>
            </Link>
          </>
        )}
        <ThemeToggle />
        {session && publicKey ? (
          <ProfileDropdown publicKey={publicKey} />
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
}
