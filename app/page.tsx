"use client";
import { useContext, useEffect, useState } from "react";
import type { Event, Filter, Relay } from "nostr-tools";
import Aside from "./Aside";
import BlogFeed from "./BlogFeed";
import Content from "./Content";
import { KeysContext } from "./context/keys-provider";
import Main from "./Main";
import RecommendedEvents from "./RecommendedEvents";
import Topics from "./Topics";
import Tabs from "./Tabs";
import { NostrService } from "./lib/nostr";
import { RelayContext } from "./context/relay-provider";
import FollowedRelays from "./FollowedRelays";

export default function HomePage() {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  const exploreFilter = {
    kinds: [2222],
    limit: 50,
    authors: undefined,
    until: undefined,
  };
  const [exploreEvents, setExploreEvents] = useState<Event[]>([]);
  const [followingEvents, setFollowingEvents] = useState<Event[]>([]);
  const [followingFilter, setFollowingFilter] = useState<Filter>();
  // const TABS = ["Explore", "Following"];
  const TABS = ["Explore"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (activeRelay) {
      let sub = activeRelay.sub([exploreFilter]);

      let relayUrl = activeRelay.url.replace("wss://", "");
      let events: Event[] = [];

      sub.on("event", (event: Event) => {
        // console.log("getting event", event, "from relay:", relay.url);
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
      });

      sub.on("eose", () => {
        console.log("EOSE initial latest events from", activeRelay.url);
        const filteredEvents = NostrService.filterBlogEvents(events);
        console.log("FILTERED____EVENTS", filteredEvents);
        if (filteredEvents.length > 0) {
          setExploreEvents(filteredEvents);
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

  return (
    <Main>
      <Content className="mt-8">
        <FollowedRelays />
        <Tabs
          className="sticky top-16 bg-white"
          TABS={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === "Explore" && (
          <BlogFeed
            events={exploreEvents}
            setEvents={setExploreEvents}
            filter={exploreFilter}
            profile={true}
          />
        )}
        {/* {activeTab === "Following" && ( */}
        {/*   <BlogFeed */}
        {/*     events={followingEvents} */}
        {/*     setEvents={setFollowingEvents} */}
        {/*     filter={followingFilter} */}
        {/*     profile={true} */}
        {/*   /> */}
        {/* )} */}
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
