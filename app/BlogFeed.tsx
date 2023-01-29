"use client";
import { useNostr } from "nostr-react";
import { useEffect, useContext, useState } from "react";
import { KeysContext } from "./context/keys-provider";
import type { Event } from "nostr-tools";
import { useSearchParams } from "next/navigation";
import { ImSearch } from "react-icons/im";
import { HiUserAdd } from "react-icons/hi";
import Button from "./Button";
import Article from "./Article";
import Pagination from "./components/util/Pagination";

export default function BlogFeed({
  numPages,
  setNumPages,
  events,
  setEvents,
  filter,
  setFilter,
  postPerPage,
}: any) {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);

  const { connectedRelays } = useNostr();

  const searchParams = useSearchParams();

  const pageSearchParam = searchParams.get("page");

  const currentPage = pageSearchParam ? parseInt(pageSearchParam) : 1;

  const [localEvents, setLocalEvents] = useState([]);

  useEffect(() => {
    setLocalEvents(events);
  }, [connectedRelays, events]);

  useEffect(() => {
    console.log("searchParams", searchParams.get("page"));
  }, [searchParams]);

  function handleFollowFilter(e: any) {
    e.preventDefault();

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

  useEffect(() => {
    console.log("NUMPAGES:", numPages);
    console.log("CURRENTPAGE:", currentPage);

    if (currentPage > numPages * 0.8) {
      console.log("LOAD MORE");

      if (events && events.slice(-1)) {
        const lastEvent = events.slice(-1)[0];
        // console.log("LAST EVENT date:", lastEvent.created_at);
      }

      connectedRelays.forEach((relay) => {
        let sub = relay.sub([filter]);
        let eventArray: Event[] = [];
        sub.on("event", (event: Event) => {
          eventArray.push(event);
        });
        sub.on("eose", () => {
          console.log("EOSE");
          console.log("eventArray", eventArray);
          // localEvents.concat(eventArray)
          const newEvents = events.concat(eventArray);
          setLocalEvents(newEvents);
          // console.log("CONCAT EVENTS", localEvents.concat(eventArray));

          if (newEvents.length) {
            const length = Math.ceil(newEvents.length / 10);
            if (length) {
              setNumPages(length);
            }
          }
          /* console.log("numPages", numPages); */
          sub.unsub();
        });
      });
    }
  }, [numPages, currentPage]);

  function handleExploreFilter(e: any) {
    e.preventDefault();
    setFilter({
      ...filter,
      authors: undefined,
    });
  }

  return (
    <>
      <div className="flex gap-2 rounded-md p-2">
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
      <div className="flex flex-col">
        {localEvents
          .slice(
            currentPage * postPerPage - postPerPage,
            currentPage * postPerPage
          )
          .map((event: Event) => {
            return <Article key={event.id} event={event} profile />;
          })}
      </div>
      {numPages > 1 ? <Pagination numPages={numPages} /> : null}
    </>
  );
}
