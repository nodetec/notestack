"use client";
import { usePathname } from "next/navigation";
import { useNostr } from "nostr-react";
import type { Event, Filter } from "nostr-tools";
import { useEffect, useContext, useState } from "react";
import Article from "./Article";
import Posts from "./Posts";

export default function BlogFeed({
  events,
  setEvents,
  filter,
  profile,
  // addedPosts,
  // setAddedPosts,
}: any) {
  const pathname = usePathname();
  const { connectedRelays } = useNostr();
  const INITIAL_SHOWN_POSTS = 10;
  const [addedPosts, setAddedPosts] = useState<number>(INITIAL_SHOWN_POSTS);
  // const [events, setEvents] = useState<Event[]>([]);

  if (pathname) {
    console.log("pathname is:", pathname);
    // page = pathname.split("/").pop() || "1";
  }

  // fetch initial 100 events for filter

  useEffect(() => {
    console.log("ADDED POSTS:", addedPosts);
    if (addedPosts > 0.8 * events.length) {
      console.log("added posts is:", addedPosts);
      const currentEvents = events;

      // console.log("latest event:", events.slice(-1)[0]);

      let until: any;

      if (events.length > 0) {
        const lastEvent = events.slice(-1)[0];
        until = lastEvent.created_at;
        console.log("until", until);
      }

      connectedRelays.forEach((relay) => {
        filter.until = until;
        let sub = relay.sub([filter]);
        let eventArray: Event[] = [];
        sub.on("event", (event: Event) => {
          eventArray.push(event);
        });
        sub.on("eose", () => {
          console.log("EOSE");
          console.log("TEST ADDED eventArray", eventArray);
          setEvents(currentEvents.concat(eventArray));
          sub.unsub();
        });
      });
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
