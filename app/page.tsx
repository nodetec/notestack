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
import { FeedContext } from "./context/feed-provider";
import { ProfilesContext } from "./context/profiles-provider";
import { FollowingContext } from "./context/following-provider";

export default function HomePage() {
  // @ts-ignore
  const { keys } = useContext(KeysContext);
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
  const { following, followingReload } = useContext(FollowingContext);

  // @ts-ignore
  const { activeRelay, pendingActiveRelayUrl } = useContext(RelayContext);

  // @ts-ignore
  const { setpubkeys } = useContext(ProfilesContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let pubkeysSet = new Set<string>();

    if (activeRelay && pendingActiveRelayUrl === activeRelay.url) {
      setExploreEvents([]);
      // console.log("ACTIVERELAY", activeRelay);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let feedKey = `latest_${relayUrl}`;

      if (feed[feedKey]) {
        // console.log("Cached events from context");
        setExploreEvents(feed[feedKey]);
      } else {
        // console.log("Getting events from relay");
        let sub = activeRelay.sub([exploreFilter]);

        let events: Event[] = [];

        sub.on("event", (event: Event) => {
          // console.log("getting event", event, "from relay:", relay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        });

        sub.on("eose", () => {
          // console.log("PUBKEYS ARE:", pubkeysSet);
          // console.log("EOSE initial latest events from", activeRelay.url);
          const filteredEvents = NostrService.filterBlogEvents(events);
          const feedKey = `latest_${relayUrl}`;
          feed[feedKey] = filteredEvents;
          setFeed(feed);
          // console.log("FILTERED____EVENTS", filteredEvents);
          if (filteredEvents.length > 0) {
            setExploreEvents(filteredEvents);
          } else {
            setExploreEvents([]);
          }
          if (pubkeysSet.size > 0) {
            setpubkeys(Array.from(pubkeysSet));
          }
          sub.unsub();
        });
      }
    }
  }, [activeRelay]);

  useEffect(() => {
    let pubkeysSet = new Set<string>();
    if (activeRelay) {
      setFollowingEvents([]);
      let relayUrl = activeRelay.url.replace("wss://", "");
      console.log("RELAY URL:", relayUrl);

      let followingKey = `following_${relayUrl}_${keys.publicKey}`;
      console.log("FOLLOWING KEY:", followingKey);
      
      const followingEvents = following[followingKey];
      console.log("FOLLOWING EVENTS:", followingEvents);
      let followingPublicKeys: string[] = [];

      if (followingEvents && following[followingKey][0]) {
        const contacts = following[followingKey][0].tags;
        console.log("CONTACTS:", contacts);

        followingPublicKeys = contacts.map((contact: any) => {
          return contact[1];
        });
        console.log("FOLLOWING PUBLIC KEYS:", followingPublicKeys);
      }

      if (followingPublicKeys.length === 0) {
        return;
      }
      const newfollowingFilter = {
        kinds: [2222],
        limit: 50,
        authors: followingPublicKeys,
        until: undefined,
      };

      console.log("NEW FOLLOWING FILTER:", newfollowingFilter);

      setFollowingFilter(newfollowingFilter);

      let followingFeedKey = `following_${relayUrl}`;
      if (feed[followingFeedKey]) {
        // console.log("Cached events from context");
        console.log("FOLLOWING EVENTS:", feed[followingKey])
        setFollowingEvents(feed[followingFeedKey]);
      } else {
        let sub = activeRelay.sub([newfollowingFilter]);
        // console.log("SUBSCRIBING TO FOLLOWING FILTER", newfollowingFilter);
        let events: Event[] = [];
        sub.on("event", (event: Event) => {
          // console.log("FOLLOWING: getting event", event, "from relay:", activeRelay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        });
        sub.on("eose", () => {
          console.log("EOSE initial latest events from", activeRelay.url);
          const filteredEvents = NostrService.filterBlogEvents(events);
          console.log("FILTERED EVENTS:", filteredEvents)
          const feedKey = `following_${relayUrl}`;
          console.log("FEED KEY:", feedKey)
          feed[feedKey] = filteredEvents;
          console.log("FEED:", feed)
          setFeed(feed);

          if (pubkeysSet.size > 0) {
            // setpubkeys(...pubkeys, [Array.from(pubkeysSet)]);
            setpubkeys(Array.from(pubkeysSet));
          }

          // console.log("FILTERED____EVENTS FOLLOWING", filteredEvents);
          if (filteredEvents.length > 0) {
            setFollowingEvents(filteredEvents);
          } else {
            setFollowingEvents([]);
          }
          sub.unsub();
        });
      }
    } else {
      setFollowingEvents([]);
    }
  }, [activeRelay, followingReload]);

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
      <Aside className="hidden md:flex">
        {followingEvents.length > 0 && (
          <RecommendedEvents
            title="Recommended Blogs"
            showProfile
            events={followingEvents.slice(0, 3)}
          />
        )}
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
