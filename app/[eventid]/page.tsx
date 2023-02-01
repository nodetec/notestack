"use client";
import { usePathname } from "next/navigation";
import { useNostrEvents } from "nostr-react";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import Blog from "./Blog";

export default function NotePage() {
  const pathname = usePathname();
  let eventId: string = "";
  if (pathname) {
    eventId = pathname.split("/").pop() || "";
    eventId = nip19.decode(eventId).data.toString();
    console.log("eventId", eventId);
  }

  const { events } = useNostrEvents({
    filter: {
      ids: [eventId],
      kinds: [2222],
    },
  });

  const event: Event = events[0];

  if (event) {
    return <Blog event={event} />;
  }
}
