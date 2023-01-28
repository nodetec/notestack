import { useSearchParams } from "next/navigation";
import { useNostrEvents } from "nostr-react";
import { useEffect, useMemo, useState } from "react";
import Article from "./Article";
import Pagination from "./components/util/Pagination";
import { getTagValues } from "./lib/utils";
import Posts from "./Posts";

const POSTS_PER_PAGE = 5;

export default function LatestArticles({ profilePubkey, name }: any) {
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
    return events
      .slice(
        currentPage * POSTS_PER_PAGE - POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
      )
      .filter((event) => event.content.length !== 0)
      .filter((event) => {
        if (event.tags) {
          const title = getTagValues("subject", event.tags);
          return title ? true : false;
        }
      });
  }, [events, currentPage]);

  return (
    <Posts className="my-8">
      <div className="flex flex-col gap-4 md:text-start">
        {slicedEvents.map((event) => (
          <Article key={event.id} event={event} dateOnly />
        ))}
      </div>
      {numPages > 1 ? <Pagination numPages={numPages} /> : null}
    </Posts>
  );
}
