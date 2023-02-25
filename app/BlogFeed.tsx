"use client";
import type { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Article from "./Article";
import ArticleSkeleton from "@/app/components/Skeleton/Article";
import { ProfilesContext } from "./context/profiles-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";
import Posts from "./Posts";
import NoBlogs from "./NoBlogs";

export default function BlogFeed({
  events,
  setEvents,
  filter,
  profile,
  isEventsLoading,
  profilePublicKey,
}: any) {
  const [addedPosts, setAddedPosts] = useState<number>(10);
  // @ts-ignore
  const { pubkeys, addProfiles } = useContext(ProfilesContext);

  const { relayUrl, subscribe } = useContext(RelayContext);

  // fetch initial 100 events for filter
  useEffect(() => {
    if (addedPosts > 0.8 * events.length) {
      const currentEvents = events;
      let pubkeysSet = new Set<string>(pubkeys);
      let relayName = relayUrl.replace("wss://", "");

      if (events.length > 0) {
        const lastEvent = currentEvents.slice(-1)[0];
        let events: Event[] = [];

        filter.until = lastEvent.created_at;
        // let sub = activeRelay.sub([filter]);

        const onEvent = (event: any) => {
          // @ts-ignore
          event.relayUrl = relayName;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        };

        const onEOSE = () => {
          // console.log("EOSE initial latest events from", activeRelay.url);
          const concatEvents = currentEvents.concat(events);
          const filteredEvents = NostrService.filterBlogEvents(concatEvents);
          if (filteredEvents.length > 0) {
            setEvents({ e: filteredEvents, isLoading: false });
          }

          if (pubkeysSet.size > 0) {
            addProfiles(Array.from(pubkeysSet));
          }
        };

        subscribe([relayUrl], filter, onEvent, onEOSE);
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
      {isEventsLoading ? (
        Array.from(Array(5)).map((_, i) => <ArticleSkeleton key={i} />)
      ) : events.length ? (
        events
          .slice(0, addedPosts)
          .map((event: Event) => (
            <Article key={event.id} event={event} profile={profile} />
          ))
      ) : (
        <NoBlogs profilePublicKey={profilePublicKey} />
      )}
    </Posts>
  );
}
