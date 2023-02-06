"use client";

import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import type { Event, Relay } from "nostr-tools";
import Content from "@/app/Content";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Topics from "@/app/Topics";
import RecommendedEvents from "@/app/RecommendedEvents";
import { AiFillTag } from "react-icons/ai";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import { FeedContext } from "@/app/context/feed-provider";
import { ProfilesContext } from "@/app/context/profiles-provider";
import FollowedRelays from "@/app/FollowedRelays";

export default function TagPage() {
  const pathname = usePathname();
  const tagname = pathname!.split("/").pop();
  const [events, setEvents] = useState<Event[]>([]);

  const TABS = ["Latest"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  // @ts-ignore
  const { activeRelay, pendingActiveRelayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  // @ts-ignore
  const { setpubkeys } = useContext(ProfilesContext);

  const filter = {
    kinds: [2222],
    limit: 100,
    "#t": [tagname],
  };

  useEffect(() => {
    let pubkeysSet = new Set<string>();

    if (activeRelay && pendingActiveRelayUrl === activeRelay.url) {
      setEvents([]);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let feedKey = `tag_${tagname}_${relayUrl}`;

      if (feed[feedKey]) {
        setEvents(feed[feedKey]);
      } else {
        // console.log("Getting events from relay");
        let sub = activeRelay.sub([filter]);

        let events: Event[] = [];

        sub.on("event", (event: Event) => {
          // console.log("getting event", event, "from relay:", relay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        });

        sub.on("eose", () => {
          const filteredEvents = NostrService.filterBlogEvents(events);
          const feedKey = `tag_${tagname}_${relayUrl}`;
          feed[feedKey] = filteredEvents;
          setFeed(feed);
          if (filteredEvents.length > 0) {
            setEvents(filteredEvents);
          } else {
            setEvents([]);
          }
          if (pubkeysSet.size > 0) {
            setpubkeys(Array.from(pubkeysSet));
          }
          sub.unsub();
        });
      }
    }
  }, [activeRelay]);

  return (
    <Main>
      <Content>
        <div className="flex items-center justify-start gap-2">
          <AiFillTag size="20" />
          <h1 className="text-5xl font-medium my-12">{tagname}</h1>
        </div>
        <FollowedRelays />
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
        {/* <RecommendedEvents */}
        {/*   title="Recommended Blogs" */}
        {/*   showProfile */}
        {/*   EVENTS={[ */}
        {/*     "0d4dfa8b61c059d2f9a670f4a75c78db823fe48bb9999781bc9c204c46790019", */}
        {/*     "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27", */}
        {/*     "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79", */}
        {/*   ]} */}
        {/* /> */}
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
