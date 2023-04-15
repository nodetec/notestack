"use client";
import { useContext, useEffect, useState } from "react";
import type { Event, Filter } from "nostr-tools";
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
import Footer from "./Footer";

export default function HomePage() {
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const exploreFilter = {
    kinds: [30023],
    limit: 50,
    authors: undefined,
    until: undefined,
  };
  const [exploreEvents, setExploreEvents] = useState<{
    e: Event[];
    isLoading: boolean;
  }>({ e: [], isLoading: true });
  const [exploreTags, setExploreTags] = useState<string[]>([]);
  const [followingEvents, setFollowingEvents] = useState<{
    e: Event[];
    isLoading: boolean;
  }>({ e: [], isLoading: true });
  const [followingFilter, setFollowingFilter] = useState<Filter>();
  const TABS = ["Explore", "Following"];
  // const TABS = ["Explore"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  // @ts-ignore
  const { following, followingReload } = useContext(FollowingContext);
  const { activeRelay, relayUrl, subscribe } = useContext(RelayContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function getTValues(tags: string[][]) {
    return tags
      .filter((subTags) => subTags[0] === "t")
      .map((subTags) => subTags[1])
      .filter((t) => t.length <= 20);
  }

  const getExploreEvents = async () => {
    let pubkeysSet = new Set<string>();
    let exploreTagsSet = new Set<string>();

    setExploreEvents({ e: [], isLoading: true });
    let relayName = relayUrl.replace("wss://", "");
    let feedKey = `latest_${relayName}`;

    if (feed[feedKey]) {
      setExploreEvents({ e: feed[feedKey], isLoading: false });
      const events = feed[feedKey];
      events.forEach((event: Event) => {
        const tValues = getTValues(event.tags);
        tValues.forEach((t) => exploreTagsSet.add(t));
      });
      setExploreTags(Array.from(exploreTagsSet).slice(0, 7));
      return;
    }

    let events: Event[] = [];

    const onEvent = (event: any) => {
      event.relayUrl = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
      const tValues = getTValues(event.tags);
      tValues.forEach((t) => exploreTagsSet.add(t));
    };

    const onEOSE = () => {
      // @ts-ignore
      const filteredEvents = NostrService.filterBlogEvents(events);
      const feedKey = `latest_${relayName}`;
      feed[feedKey] = filteredEvents;
      setExploreTags(Array.from(exploreTagsSet));
      setFeed(feed);
      if (filteredEvents.length > 0) {
        // @ts-ignore
        setExploreEvents({ e: filteredEvents, isLoading: false });
      } else {
        setExploreEvents({ e: [], isLoading: false });
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
    };

    subscribe([relayUrl], exploreFilter, onEvent, onEOSE);
  };

  const getFollowingEvents = async () => {
    setFollowingEvents({ e: [], isLoading: true });
    let relayName = relayUrl.replace("wss://", "");

    let followingKey = `following_${relayName}_${keys.publicKey}`;

    const followingEvents = following[followingKey];
    let followingPublicKeys: string[] = [];

    if (followingEvents && following[followingKey]) {
      const contacts = following[followingKey];

      followingPublicKeys = contacts;
    }

    if (followingPublicKeys.length === 0) {
      return;
    }

    const newfollowingFilter = {
      kinds: [30023],
      limit: 50,
      authors: followingPublicKeys,
      until: undefined,
    };

    setFollowingFilter(newfollowingFilter);

    let followingFeedKey = `following_${relayName}`;
    if (feed[followingFeedKey]) {
      setFollowingEvents({ e: feed[followingFeedKey], isLoading: false });
      return;
    }

    let events: Event[] = [];

    const onEvent = (event: any) => {
      event.relayUrl = relayName;
      events.push(event);
    };

    const onEOSE = () => {
      // @ts-ignore
      const filteredEvents = NostrService.filterBlogEvents(events);
      const feedKey = `following_${relayName}`;
      feed[feedKey] = filteredEvents;
      setFeed(feed);

      if (filteredEvents.length > 0) {
        // @ts-ignore
        setFollowingEvents({ e: filteredEvents, isLoading: false });
      } else {
        setFollowingEvents({ e: [], isLoading: false });
      }
    };

    subscribe([relayUrl], newfollowingFilter, onEvent, onEOSE);
  };

  useEffect(() => {
    getExploreEvents();
    getFollowingEvents();
  }, [activeRelay]);

  useEffect(() => {
    getFollowingEvents();
  }, [followingReload]);

  return (
    <Main>
      <Content className="mt-8">
        <FollowedRelays />
        <Tabs
          className="sticky top-0 z-10"
          TABS={TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === "Explore" && (
          <BlogFeed
            events={exploreEvents.e}
            setEvents={setExploreEvents}
            filter={exploreFilter}
            profile={true}
            isEventsLoading={exploreEvents.isLoading}
          />
        )}
        {activeTab === "Following" && (
          <BlogFeed
            events={followingEvents.e}
            setEvents={setFollowingEvents}
            filter={followingFilter}
            profile={true}
            isEventsLoading={followingEvents.isLoading}
          />
        )}
      </Content>
      <Aside>
        <RecommendedEvents
          title="Recommended Blogs"
          showProfile
          events={exploreEvents.e.slice(0, 3)}
          isEventsLoading={exploreEvents.isLoading}
        />
        <Topics
          title="Recommended Topics"
          TOPICS={exploreTags.length > 0 ? exploreTags.slice(0, 7) : []}
          isEventsLoading={exploreEvents.isLoading}
        />
        <Footer />
      </Aside>
    </Main>
  );
}
