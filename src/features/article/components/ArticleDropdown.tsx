"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { DEFAULT_RELAYS } from "~/lib/constants";
import { getEvent } from "~/lib/nostr";
import { signOut } from "next-auth/react";
import { type AddressPointer } from "nostr-tools/nip19";

type Props = {
  children: React.ReactNode;
  address: AddressPointer;
  publicKey: string | undefined;
};

export function ArticleDropdown({ children, address, publicKey }: Props) {
  async function broadcaseArticle() {

    const filter = {
      kinds: [address.kind],
      limit: 1,
      "#d": [address.identifier],
    };

    const event = await getEvent(filter, address.relays ?? DEFAULT_RELAYS);

    // get event
    // get users write relays
    // publish to users write relays
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => signOut()}>Broadcast</DropdownMenuItem>
        {/* <DropdownMenuItem asChild> */}
        {/*   <Link href="/settings">Settings</Link> */}
        {/* </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium"> */}
        {/*   Inbox */}
        {/* </DropdownMenuItem> */}
        {/* <DropdownMenuItem className="my-2 cursor-pointer text-[1rem] font-medium"> */}
        {/*   Stacks */}
        {/* </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
