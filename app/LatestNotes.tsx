import { useSearchParams } from "next/navigation";
import { useNostrEvents } from "nostr-react";
import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import Pagination from "./components/util/Pagination";
import Posts from "./Posts";

const POSTS_PER_PAGE = 5;

export default function LatestNotes({ profilePubkey, name }: any) {

  const { events } = useNostrEvents({
    filter: {
      kinds: [2222],
      authors: [profilePubkey],
    },
  });

  const [numPages, setNumPages] = useState<number>(0);
  const searchParams = useSearchParams();
  const pageSearchParam = searchParams.get("page");
  const currentPage = pageSearchParam ? parseInt(pageSearchParam) : 1;

  useEffect(() => {
    setNumPages(Math.ceil(events.length / POSTS_PER_PAGE));
  }, [events]);

  const slicedEvents = useMemo(() => {
    return events.slice(
      currentPage * POSTS_PER_PAGE - POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE
    );
  }, [events, currentPage]);

  return (
    <Posts
      title={
        events.length > 0
          ? `${name ? `${name}'s l` : "L"}atest notes`
          : `${name ? `${name} has no notes yet` : "No notes yet"}`
      }
    >
      <ul className="flex flex-col gap-4 text-center md:text-start">
        {slicedEvents.map((event) => (
          <Card key={event.id} event={event} dateOnly />
        ))}
      </ul>
      {numPages > 1 ? <Pagination numPages={numPages} /> : null}
    </Posts>
  );
}
