"use client";
import { useNostr } from "nostr-react";
import { useEffect, useContext } from "react";
import { KeysContext } from "./context/keys-provider";
import type { Event } from "nostr-tools";
import { useSearchParams } from "next/navigation";
import { ImSearch } from "react-icons/im";
import { HiUserAdd } from "react-icons/hi";
import Button from "./Button";
import Article from "./Article";

export default function ArchiveNotes({
  numPages,
  events,
  filter,
  setFilter,
  postPerPage,
}: any) {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);

  const searchParams = useSearchParams();

  const pageSearchParam = searchParams.get("page");

  const currentPage = pageSearchParam ? parseInt(pageSearchParam) : 1;

  useEffect(() => {
    console.log("searchParams", searchParams.get("page"));
  }, [searchParams]);

  const { connectedRelays } = useNostr();

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
        {events
          .slice(
            currentPage * postPerPage - postPerPage,
            currentPage * postPerPage
          )
          .map((event: Event) => {
            return <Article key={event.id} event={event} profile />;
          })}
      </div>
      {/* {numPages > 1 ? <Pagination numPages={numPages} /> : null} */}
    </>
  );
}
