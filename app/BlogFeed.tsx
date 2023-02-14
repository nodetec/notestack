"use client";
import type { Event } from "nostr-tools";
import { Fragment, useContext, useEffect, useState } from "react";
import Article from "./Article";
import { ProfilesContext } from "./context/profiles-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";
import LoadingPost from "./LoadingPost";
import Posts from "./Posts";

export default function BlogFeed({ events, setEvents, filter, profile }: any) {
  const [addedPosts, setAddedPosts] = useState<number>(10);
  // @ts-ignore
  const { pubkeys, setpubkeys } = useContext(ProfilesContext);

  const { activeRelay, relayUrl } = useContext(RelayContext);
  const [isLoading, setLoading] = useState(true);
  // fetch initial 100 events for filter
  useEffect(() => {
    if (addedPosts > 0.8 * events.length) {
      const currentEvents = events;
      let pubkeysSet = new Set<string>(pubkeys);

      if (events.length > 0) {
        if (activeRelay) {
          const lastEvent = currentEvents.slice(-1)[0];
          let events: Event[] = [];

          filter.until = lastEvent.created_at;
          let sub = activeRelay.sub([filter]);

          sub.on("event", (event: Event) => {
            // console.log("getting event", event, "from relay:", relay.url);
            // @ts-ignore
            event.relayUrl = relayUrl;
            events.push(event);
            pubkeysSet.add(event.pubkey);
          });
          sub.on("eose", () => {
            // console.log("EOSE initial latest events from", activeRelay.url);
            const concatEvents = currentEvents.concat(events);
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
      }
    }
    setLoading(false);
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
      {isLoading ? (
        <Fragment>
          <LoadingPost></LoadingPost>
          <LoadingPost></LoadingPost>
          <LoadingPost></LoadingPost>
          <LoadingPost></LoadingPost>
          <LoadingPost></LoadingPost>
        </Fragment>
      ) : (
        events.slice(0, addedPosts).map((event: Event) => {
          return <Article key={event.id} event={event} profile={profile} />;
        })
      )}
    </Posts>
  );
}
