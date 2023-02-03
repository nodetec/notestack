"use client";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Event, Relay } from "nostr-tools";
import { nip19 } from "nostr-tools";
import Blog from "./Blog";
import { RelayContext } from "../context/relay-provider";

export default function NotePage() {
  const pathname = usePathname();
  let eventId: string = "";
  if (pathname) {
    eventId = pathname.split("/").pop() || "";
    eventId = nip19.decode(eventId).data.toString();
    console.log("eventId", eventId);
  }

  // @ts-ignore
  const { connectedRelays } = useContext(RelayContext);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (events.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay: Relay) => {
        // @ts-ignore
        let sub = relay.sub([
          {
            ids: [eventId],
            kinds: [2222],
          },
        ]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          setEvents(eventArray);
          sub.unsub();
        });
      });
    }
  }, [connectedRelays]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (events[0]) {
    return <Blog event={events[0]} />;
  }
}
