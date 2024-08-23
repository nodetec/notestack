"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { getAllWriteRelays, publishFinishedEvent } from "~/lib/nostr";
import { type Event } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";
import { toast } from "sonner";

type Props = {
  children: React.ReactNode;
  address: AddressPointer;
  publicKey: string | undefined;
  articleEvent: Event;
};

export function ArticleDropdown({
  children,
  address,
  publicKey,
  articleEvent,
}: Props) {
  async function broadcastArticle() {
    const relays = await getAllWriteRelays(publicKey);

    const published = await publishFinishedEvent(articleEvent, relays);

    if (published) {
      toast("Article broadcast", {
        description: "The article has been successfully broadcast.",
      });
    } else {
      toast("failed to broadcast article", {
        description: "There was an error broadcasting the article.",
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {publicKey && (
          <DropdownMenuItem onClick={broadcastArticle}>
            Broadcast
          </DropdownMenuItem>
        )}
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
