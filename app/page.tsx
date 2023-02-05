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
  const { connectedRelays, activeRelays, isReady } = useContext(RelayContext);

  useEffect(() => {
    window.scrollTo(0, 0);

    // if (followingEvents.length === 0) {
    //   const followingEventsString = sessionStorage.getItem(
    //     "latest_following_events"
    //   );
    //   if (followingEventsString) {
    //     const cachedEvents = JSON.parse(followingEventsString);
    //     setFollowingEvents(cachedEvents);
    //     console.log("using cached latest following events");
    //   }
    // }
  }, []);

  useEffect(() => {
    // setExploreEvents([]);
    // setFollowingEvents([]);
    let count = 0;
    const eventObj: { [fieldName: string]: any } = {};
    connectedRelays.forEach((relay: Relay) => {
      let sub = relay.sub([exploreFilter]);

      let relayUrl = relay.url.replace("wss://", "");
      eventObj[relayUrl] = [];

      const cachedLatestEventsString = sessionStorage.getItem(
        `latest_events_${relayUrl}`
      );

      if (cachedLatestEventsString) {
        console.log("USING THE CACHE");
        count++;
        const cachedEvents = JSON.parse(cachedLatestEventsString);
        eventObj[relayUrl] = cachedEvents;
        console.log("cachedEvents are:", cachedEvents);
        console.log("using cached latest events for:" + relayUrl);

        if (count === connectedRelays.length) {
          const filteredEvents = NostrService.filterBlogEvents(eventObj);
          console.log("FILTERED____EVENTS", filteredEvents);
          if (filteredEvents.length > 0) {
            setExploreEvents(filteredEvents);
          }
          console.log("eventObj", eventObj);
        }
      } else {
        sub.on("event", (event: Event) => {
          // console.log("getting event", event, "from relay:", relay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          eventObj[relayUrl].push(event);
        });

        sub.on("eose", () => {
          const eventsString = JSON.stringify(eventObj[relayUrl]);
          if (eventsString.length > 0) {
            sessionStorage.setItem(`latest_events_${relayUrl}`, eventsString);
          }
          count++;
          console.log("EOSE initial latest events from", relay.url);
          if (count === connectedRelays.length) {
            const filteredEvents = NostrService.filterBlogEvents(eventObj);
            console.log("FILTERED____EVENTS", filteredEvents);
            if (filteredEvents.length > 0) {
              setExploreEvents(filteredEvents);
            }
            console.log("eventObj", eventObj);
          }
          sub.unsub();
        });
      }
    });

    // const followingEventsString = sessionStorage.getItem("latest_events");
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
        // if (!followingEventsString && followingEvents.length === 0) {
        let count = 0;
        const eventObj: { [fieldName: string]: any } = {};
        connectedRelays.forEach((relay: Relay) => {
          let sub = relay.sub([newfollowingFilter]);

          let relayUrl = relay.url.replace("wss://", "");
          eventObj[relayUrl] = [];

          sub.on("event", (event: Event) => {
            // @ts-ignore
            event.relayUrl = relayUrl;
            eventObj[relayUrl].push(event);
          });
          sub.on("eose", () => {
            count++;

            console.log("EOSE initial latest events from", relay.url);
            if (count === connectedRelays.length) {
              const filteredEvents = NostrService.filterBlogEvents(eventObj);
              console.log("FILTERED____EVENTS", filteredEvents);
              if (filteredEvents.length > 0) {
                setFollowingEvents(filteredEvents);
              }
              console.log("eventObj", eventObj);
            }
            sub.unsub();
          });
        });
        sub.unsub();
      });
    });
  }, [isReady]);

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
