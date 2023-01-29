"use client";
import { usePathname } from "next/navigation";
import { useNostr } from "nostr-react";
import type { Event, Filter } from "nostr-tools";
import { useEffect, useContext, useState } from "react";
import { HiUserAdd } from "react-icons/hi";
import { ImSearch } from "react-icons/im";
import Article from "./Article";
import Button from "./Button";
// import Posts from "../Posts";
import Content from "./Content";
import Posts from "./Posts";
import { KeysContext } from "./context/keys-provider";

export default function HomePage() {
  const pathname = usePathname();
  const INITIAL_POSTS = 100;
  const INITIAL_SHOWN_POSTS = 10;
  const { connectedRelays } = useNostr();
  const [events, setEvents] = useState<Event[]>([]);
  const [addedPosts, setAddedPosts] = useState<number>(INITIAL_SHOWN_POSTS);

  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);

  const [filter, setFilter] = useState<Filter>({
    kinds: [2222],
    limit: INITIAL_POSTS,
    authors: undefined,
    until: undefined,
  });

  if (pathname) {
    console.log("pathname is:", pathname);
    // page = pathname.split("/").pop() || "1";
  }

  useEffect(() => {
    console.log("something should happen when I click filter");
    connectedRelays.forEach((relay) => {
      let sub = relay.sub([filter]);
      let eventArray: Event[] = [];
      sub.on("event", (event: Event) => {
        eventArray.push(event);
      });
      sub.on("eose", () => {
        console.log("EOSE");
        console.log("eventArray", eventArray);
        setEvents(eventArray);
        sub.unsub();
      });
    });
  }, [filter, connectedRelays]);

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
          console.log("eventArray", eventArray);
          setEvents(currentEvents.concat(eventArray));
          sub.unsub();
        });
      });
    }
  }, [addedPosts]);

  function handleFollowFilter(e: any) {
    e.preventDefault();
    setAddedPosts(INITIAL_SHOWN_POSTS);

    // let followedAuthors: Set<string> = new Set();
    let followedAuthors: string[];

    connectedRelays.forEach((relay) => {
      let sub = relay.sub([
        {
          authors: [loggedInUserKeys.publicKey],
          kinds: [3],
          limit: 100,
        },
      ]);
      sub.on("event", (event: Event) => {
        // eventArray.push(event);
        // TODO: we could go through each event and add each lis of followers to a set, but for now we'll just use one
        followedAuthors = event.tags.map((pair: string[]) => pair[1]);
        console.log("followedAuthors", followedAuthors);
      });
      sub.on("eose", () => {
        console.log("EOSE");
        setFilter({
          ...filter,
          authors: followedAuthors,
        });
        sub.unsub();
      });
    });
  }

  function handleExploreFilter(e: any) {
    e.preventDefault();
    setAddedPosts(INITIAL_SHOWN_POSTS);
    setFilter({
      ...filter,
      authors: undefined,
    });
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 10) return;
      console.log("it worked")
      setAddedPosts((prev) => prev + 10);
    };

    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Content>
      <div className="flex gap-2 rounded-md p-2 mt-16">
        <Button
          variant={filter.authors?.length ? "ghost" : "solid"}
          onClick={handleExploreFilter}
          size="sm"
          icon={<ImSearch />}
          className="w-full"
        >
          explore
        </Button>
        <Button
          variant={filter.authors?.length ? "solid" : "ghost"}
          onClick={handleFollowFilter}
          icon={<HiUserAdd />}
          size="sm"
          className="w-full"
        >
          following
        </Button>
      </div>

      <Posts title="Latest Posts" className="mx-auto my-16">
        {events.slice(0, addedPosts).map((event: Event) => {
          return <Article key={event.id} event={event} profile />;
        })}
      </Posts>
    </Content>
  );
}
