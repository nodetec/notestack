"use client";

import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import type { Event } from "nostr-tools";
import Content from "@/app/Content";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { useNostr } from "nostr-react";
import { useEffect, useState } from "react";
import Topics from "@/app/Topics";
import RecommendedEvents from "@/app/RecommendedEvents";
import { AiFillTag } from "react-icons/ai";

export default function TagPage() {
  const pathname = usePathname();
  const tagname = pathname!.split("/").pop();
  const [events, setEvents] = useState<Event[]>([]);
  const { connectedRelays } = useNostr();

  const TABS = ["Latest"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  const filter = {
    kinds: [2222],
    limit: 100,
    "#t": [tagname],
  };

  useEffect(() => {
    if (events.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay) => {
        // @ts-ignore
        let sub = relay.sub([filter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          setEvents(eventArray);
          sub.unsub();
        });
      });
    }
  }, [connectedRelays]);

  return (
    <Main>
      <Content>
        <div className="flex items-center justify-start gap-2">
          <AiFillTag size="20" />
          <h1 className="text-5xl font-medium my-12">{tagname}</h1>
        </div>
        <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Latest" ? (
          <BlogFeed
            events={events}
            setEvents={setEvents}
            filter={filter}
            profile={true}
          />
        ) : null}
      </Content>
      <Aside>
        <RecommendedEvents
          title="Recommended Blogs"
          showProfile
          EVENTS={[
            "0d4dfa8b61c059d2f9a670f4a75c78db823fe48bb9999781bc9c204c46790019",
            "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27",
            "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79",
          ]}
        />
        <Topics
          title="Recommended Topics"
          TOPICS={[
            "nostr",
            "lightning",
            "bitcoin",
            "taproot",
            "tailwindcss",
            "chess",
          ]}
        />
      </Aside>
    </Main>
  );
}
