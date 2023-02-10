"use client";
import type { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Article from "./Article";
import { ProfilesContext } from "./context/profiles-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";
import Posts from "./Posts";

export default function BlogFeed({ events, setEvents, filter, profile }: any) {
  const [addedPosts, setAddedPosts] = useState<number>(10);
  // @ts-ignore
  const { profiles, setProfiles, pubkeys, setpubkeys } =
    useContext(ProfilesContext);

  // @ts-ignore
  const { activeRelay, relayUrl, connect, subToRelay } =
    useContext(RelayContext);

  const getEvents = async () => {
    if (addedPosts < 0.8 * events.length) return;
    const currentEvents = events;
    let pubkeysSet = new Set<string>(pubkeys);

    if (currentEvents.length > 0) {
      const lastEvent = currentEvents.slice(-1)[0];
      let newEvents: Event[] = [];

      filter.until = lastEvent.created_at;

      const relay = await connect(relayUrl, activeRelay);
      if (!relay) return;
      let sub = relay.sub([filter]);

      sub.on("event", (event: Event) => {
        // console.log("getting event", event, "from relay:", relay.url);
        // @ts-ignore
        event.relayUrl = relayName;
        newEvents.push(event);
        pubkeysSet.add(event.pubkey);
      });
      sub.on("eose", () => {
        // console.log("EOSE initial latest events from", activeRelay.url);
        const concatEvents = currentEvents.concat(newEvents);
        const filteredEvents = NostrService.filterBlogEvents(concatEvents);
        if (filteredEvents.length > 0) {
          setEvents(filteredEvents);
        }

        if (pubkeysSet.size > 0) {
          setpubkeys(Array.from(pubkeysSet));
        }

        sub.unsub();
      });
    }
  };

  // fetch initial 100 events for filter
  useEffect(() => {
    getEvents();
  }, [relayUrl, addedPosts]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.innerHeight + document.documentElement.scrollTop;
      if (Math.ceil(scrollTop) !== document.documentElement.offsetHeight)
        return;
      setAddedPosts((prev: number) => prev + 10);
    };

    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Posts title="Latest Posts" className="mx-auto mb-16">
      {events.slice(0, addedPosts).map((event: Event) => {
        return <Article key={event.id} event={event} profile={profile} />;
      })}
    </Posts>
  );
}
