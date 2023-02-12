"use client";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { Event } from "nostr-tools";
import { nip19 } from "nostr-tools";
import Blog from "./Blog";
import { RelayContext } from "../context/relay-provider";
import { CachedEventContext } from "../context/cached-event-provider";
import { NostrService } from "../lib/nostr";
import { ProfilesContext } from "../context/profiles-provider";

export default function NotePage() {
  const pathname = usePathname();
  let eventId: string = "";
  if (pathname && pathname.length > 60) {
    eventId = pathname.split("/").pop() || "";
    eventId = nip19.decode(eventId).data.toString();
  }

  const { relayUrl, activeRelay, connect } = useContext(RelayContext);
  const [event, setEvent] = useState<Event>();
  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  // @ts-ignore
  const { cachedEvent, setCachedEvent } = useContext(CachedEventContext);

  const getEvents = async () => {
    let pubkeysSet = new Set<string>();

    setEvent(undefined);
    let relayName = relayUrl.replace("wss://", "");

    const relay = await connect(relayUrl);
    if (!relay) return;
    let sub = relay.sub([
      {
        ids: [eventId],
        kinds: [30023],
      },
    ]);

    let events: Event[] = [];

    sub.on("event", (event: Event) => {
      // @ts-ignore
      event.relayName = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    });

    sub.on("eose", () => {
      if (events.length > 0) {
        setEvent(events[0]);
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
      sub.unsub();
    });
  };

  // todo cache
  useEffect(() => {
    if (cachedEvent) {
      // console.log("Using cached event", cachedEvent);
      setEvent(cachedEvent);
      setCachedEvent(undefined);
      return;
    }
    getEvents();
  }, [activeRelay]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (event) {
    return <Blog event={event} />;
  }
}
