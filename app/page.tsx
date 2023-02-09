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
    kinds: [30023],
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
  const { activeRelay, relayUrl, connect } = useContext(RelayContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getExploreEvents = async () => {
    let pubkeysSet = new Set<string>();

    setExploreEvents([]);
    let relayName = relayUrl.replace("wss://", "");
    let feedKey = `latest_${relayName}`;

    if (feed[feedKey]) {
      setExploreEvents(feed[feedKey]);
      return;
    }

    const relay = await connect(relayUrl, activeRelay);
    if (!relay) return;
    let sub = relay.sub([exploreFilter]);

    let events: Event[] = [];

    sub.on("event", (event: Event) => {
      // @ts-ignore
      event.relayUrl = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    });

    sub.on("eose", () => {
      const filteredEvents = NostrService.filterBlogEvents(events);
      const feedKey = `latest_${relayName}`;
      feed[feedKey] = filteredEvents;
      setFeed(feed);
      if (filteredEvents.length > 0) {
        setExploreEvents(filteredEvents);
      } else {
        setExploreEvents([]);
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
      sub.unsub();
    });
  };

  // const getFollowingEvents = async () => {
  //   let pubkeysSet = new Set<string>();

  //   setFollowingEvents([]);
  //   let relayName = relayUrl.replace("wss://", "");

  //   let followingKey = `following_${relayName}_${keys.publicKey}`;

  //   const followingEvents = following[followingKey];
  //   let followingPublicKeys: string[] = [];

  //   if (followingEvents && following[followingKey][0]) {
  //     const contacts = following[followingKey][0].tags;

  //     followingPublicKeys = contacts.map((contact: any) => {
  //       return contact[1];
  //     });
  //   }

  //   if (followingPublicKeys.length === 0) {
  //     return;
  //   }
  //   const newfollowingFilter = {
  //     kinds: [30023],
  //     limit: 50,
  //     authors: followingPublicKeys,
  //     until: undefined,
  //   };

  //   setFollowingFilter(newfollowingFilter);

  //   let followingFeedKey = `following_${relayName}`;
  //   if (feed[followingFeedKey]) {
  //     setFollowingEvents(feed[followingFeedKey]);
  //     // return;
  //   }
  //   console.log("MADE IT 1");

  //   let events: Event[] = [];

  //   const relay = await NostrService.connect(relayUrl);
  //   if (!relay) return;
  //   let sub = relay.sub([newfollowingFilter]);
  //   console.log("MADE IT 2");

  //   sub.on("event", (event: Event) => {
  //     console.log("following event:", event);
  //     // @ts-ignore
  //     event.relayUrl = relayName;
  //     events.push(event);
  //     pubkeysSet.add(event.pubkey);
  //   });

  //   console.log("MADE IT 3");

  //   sub.on("eose", () => {
  //     const filteredEvents = NostrService.filterBlogEvents(events);
  //     const feedKey = `following_${relayName}`;
  //     feed[feedKey] = filteredEvents;
  //     setFeed(feed);

  //     if (pubkeysSet.size > 0) {
  //       setpubkeys([...Array.from(pubkeysSet), ...pubkeys]);
  //     }

  //     if (filteredEvents.length > 0) {
  //       setFollowingEvents(filteredEvents);
  //     } else {
  //       setFollowingEvents([]);
  //     }
  //     sub.unsub();
  //   });
  // };

  useEffect(() => {
    getExploreEvents();
  }, [relayUrl]);

  // useEffect(() => {
  //   getFollowingEvents();
  // }, [relayUrl, followingReload]);

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
