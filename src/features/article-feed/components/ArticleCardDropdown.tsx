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
import { createEventAddress, getTag, publishFinishedEvent } from "~/lib/nostr";
import { type Event } from "nostr-tools";
import { toast } from "sonner";

import { useDeleteArticle } from "../hooks/useDeleteArticle";

type Props = {
  children: React.ReactNode;
  articleEvent: Event;
};

export function ArticleCardDropdown({ children, articleEvent }: Props) {
  const { userPublicKey } = useAuth();

  const deleteArticleMutation = useDeleteArticle();

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();

    if (!articleEvent) {
      return;
    }

    const dTagValue = getTag("d", articleEvent.tags);

    if (!dTagValue) {
      return;
    }

    const articleAddress = createEventAddress(
      30023,
      articleEvent.pubkey,
      dTagValue,
    );

    const relayMetadataEvent = await getRelayMetadataEvent(
      DEFAULT_RELAYS,
      userPublicKey,
    );
    if (!relayMetadataEvent) {
      toast("Failed to delete article", {
        description: "Make sure to set your relays in settings.",
      });
      return;
    }

    const relayMetadata = parseRelayMetadataEvent(relayMetadataEvent);

    deleteArticleMutation.mutate({
      articleAddress,
      relays: relayMetadata.relays,
      articleEventId: articleEvent.id,
    });
  }

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
        {userPublicKey && userPublicKey === articleEvent.pubkey && (
          <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
        )}
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
