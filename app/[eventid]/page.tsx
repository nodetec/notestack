"use client";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import Blog from "./Blog";
import { RelayContext } from "../context/relay-provider";
import { CachedEventContext } from "../context/cached-event-provider";

export default function NotePage() {
  const pathname = usePathname();
  let eventId: string = "";
  if (pathname) {
    eventId = pathname.split("/").pop() || "";
    eventId = nip19.decode(eventId).data.toString();
  }

  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);
  const [events, setEvents] = useState<Event[]>([]);

  // @ts-ignore
  const { cachedEvent, setCachedEvent } = useContext(CachedEventContext);

  // todo cache
  useEffect(() => {
    if (cachedEvent) {
      console.log("Using cached event", cachedEvent);
      setEvents([cachedEvent]);
      setCachedEvent(undefined);
      return;
    }

    if (!activeRelay) return;
    if (events.length === 0) {
      let eventArray: Event[] = [];
      // @ts-ignore
      let sub = activeRelay.sub([
        {
          ids: [eventId],
          kinds: [30023],
        },
      ]);
      sub.on("event", (event: Event) => {
        eventArray.push(event);
      });
      sub.on("eose", () => {
        if (eventArray.length > 0) {
          setEvents(eventArray);
        } else {
          // console.log("Event not present");
          // TODO: Show 404 page
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (events[0]) {
    return <Blog event={events[0]} />;
  }
}
