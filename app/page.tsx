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
  const TABS = ["Explore", "Following"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  // @ts-ignore
  const { connectedRelays, activeRelays } = useContext(RelayContext);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (exploreEvents.length === 0) {
      const latestEventsString = sessionStorage.getItem("latest_events");
      if (latestEventsString) {
        const cachedEvents = JSON.parse(latestEventsString);
        setExploreEvents(cachedEvents);
        console.log("using cached latest events");
      }
    }

    if (followingEvents.length === 0) {
      const followingEventsString = sessionStorage.getItem(
        "latest_following_events"
      );
      if (followingEventsString) {
        const cachedEvents = JSON.parse(followingEventsString);
        setFollowingEvents(cachedEvents);
        console.log("using cached latest following events");
      }
    }
  }, []);

  useEffect(() => {
    const latestEventsString = sessionStorage.getItem("latest_events");
    if (!latestEventsString && exploreEvents.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay: Relay) => {
        let sub = relay.sub([exploreFilter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          console.log("EOSE initial latest events from", relay.url);
          const filteredEvents = NostrService.filterBlogEvents(eventArray);
          if (filteredEvents.length > 0) {
            setExploreEvents(filteredEvents);
            const eventsString = JSON.stringify(filteredEvents);
            sessionStorage.setItem("latest_events", eventsString);
          }
          sub.unsub();
        });
      });
    }

    const followingEventsString = sessionStorage.getItem("latest_events");
    let followedAuthors: string[];

    connectedRelays.forEach((relay: Relay) => {
      let sub = relay.sub([
        {
          authors: [loggedInUserKeys.publicKey],
          kinds: [3],
          limit: 50,
        },
      ]);
      sub.on("event", (event: Event) => {
        // TODO: we could go through each event and add each lis of followers to a set, but for now we'll just use one
        followedAuthors = event.tags.map((pair: string[]) => pair[1]);
      });
      sub.on("eose", () => {
        console.log("EOSE top 50 followed users from", relay.url);
        const newfollowingFilter = {
          kinds: [2222],
          limit: 50,
          authors: followedAuthors,
          until: undefined,
        };

        setFollowingFilter(newfollowingFilter);
        if (!followingEventsString && followingEvents.length === 0) {
          const eventsSeen: { [k: string]: boolean } = {};
          let eventArray: Event[] = [];
          connectedRelays.forEach((relay: Relay) => {
            let sub = relay.sub([newfollowingFilter]);
            sub.on("event", (event: Event) => {
              if (!eventsSeen[event.id!]) {
                eventArray.push(event);
              }
              eventsSeen[event.id!] = true;
            });
            sub.on("eose", () => {
              console.log("EOSE initial following events from", relay.url);

              const filteredEvents = NostrService.filterBlogEvents(eventArray);
              if (filteredEvents.length > 0) {
                setFollowingEvents(filteredEvents);
                const eventsString = JSON.stringify(filteredEvents);
                sessionStorage.setItem("latest_following_events", eventsString);
              }
              sub.unsub();
            });
          });
        }
        sub.unsub();
      });
    });
  }, [connectedRelays, activeRelays]);

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
        {activeTab === "Following" && (
          <BlogFeed
            events={followingEvents}
            setEvents={setFollowingEvents}
            filter={followingFilter}
            profile={true}
          />
        )}
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
