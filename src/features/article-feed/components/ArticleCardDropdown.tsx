"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import useAuth from "~/hooks/useAuth";
import { DEFAULT_RELAYS } from "~/lib/constants";
import {
  getRelayMetadataEvent,
  parseRelayMetadataEvent,
} from "~/lib/events/relay-metadata-event";
import { publishFinishedEvent } from "~/lib/nostr";
import { type Event } from "nostr-tools";
import { toast } from "sonner";

type Props = {
  children: React.ReactNode;
  articleEvent: Event;
};

export function ArticleCardDropdown({ children, articleEvent }: Props) {
  const { userPublicKey } = useAuth();
  async function broadcastArticle(e: React.MouseEvent) {
    e.stopPropagation();
    const relayMetadataEvent = await getRelayMetadataEvent(
      DEFAULT_RELAYS,
      userPublicKey,
    );
    if (!relayMetadataEvent) {
      toast("Failed to broadcast article", {
        description: "Make sure to set your relays in settings.",
      });
      return;
    }

    const relayMetadata = parseRelayMetadataEvent(relayMetadataEvent);

    const published = await publishFinishedEvent(
      articleEvent,
      relayMetadata.writeRelays,
    );

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
      <DropdownMenuContent className="z-20" align="center">
        {userPublicKey && (
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
