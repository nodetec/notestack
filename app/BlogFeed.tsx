"use client";
import { useNostr } from "nostr-react";
import type { Event } from "nostr-tools";
import { useEffect, useState } from "react";
import Article from "./Article";
import { NostrService } from "./lib/nostr";
import Posts from "./Posts";

export default function BlogFeed({ events, setEvents, filter, profile }: any) {
  const { connectedRelays } = useNostr();
  const [addedPosts, setAddedPosts] = useState<number>(10);

  // fetch initial 100 events for filter
  useEffect(() => {
    if (addedPosts > 0.8 * events.length) {
      const currentEvents = events;

      if (events.length > 0) {
        const lastEvent = events.slice(-1)[0];
        let eventArray: Event[] = [];
        const eventsSeen: { [k: string]: boolean } = {};
        connectedRelays.forEach((relay) => {
          filter.until = lastEvent.created_at;
          let sub = relay.sub([filter]);
          sub.on("event", (event: Event) => {
            if (!eventsSeen[event.id!]) {
              eventArray.push(event);
            }
          });
          sub.on("eose", () => {
            console.log("EOSE additional events from", relay.url);
            const concatEvents = currentEvents.concat(eventArray);
            const filteredEvents = NostrService.filterBlogEvents(concatEvents);
            if (filteredEvents.length > 0) {
              setEvents(filteredEvents);
            }
            sub.unsub();
          });
        });
      }
    }
  }, [addedPosts]);

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
