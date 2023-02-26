"use client";

import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import type { Event } from "nostr-tools";
import Content from "@/app/Content";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Topics from "@/app/Topics";
import RecommendedEvents from "@/app/RecommendedEvents";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import { FeedContext } from "@/app/context/feed-provider";
import { ProfilesContext } from "@/app/context/profiles-provider";
import FollowedRelays from "@/app/FollowedRelays";
import { Tag } from "@/app/icons";

export default function TagPage() {
  const pathname = usePathname();
  const tagname = pathname!.split("/").pop();
  const [events, setEvents] = useState<Event[]>([]);

  const TABS = ["Latest"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const { relayUrl, activeRelay, subscribe } = useContext(RelayContext);

  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  const [eventTags, setEventTags] = useState<string[]>([]);

  const filter = {
    kinds: [30023],
    limit: 100,
    "#t": [tagname],
  };

  function getTValues(tags: string[][]) {
    return tags
      .filter((subTags) => subTags[0] === "t")
      .map((subTags) => subTags[1])
      .filter((t) => t.length <= 20);
  }

  const getTagEvents = async () => {
    let pubkeysSet = new Set<string>();
    let eventTagsSet = new Set<string>();

    setEvents([]);
    let relayName = relayUrl.replace("wss://", "");
    let feedKey = `tag_${tagname}_${relayName}`;

    if (feed[feedKey]) {
      setEvents(feed[feedKey]);
      const events = feed[feedKey];
      events.forEach((event: Event) => {
        const tValues = getTValues(event.tags);
        tValues.forEach((t) => eventTagsSet.add(t));
      });
      setEventTags(Array.from(eventTagsSet).slice(0, 7));
      return;
    }

    let events: Event[] = [];

    const onEvent = (event: any) => {
      // @ts-ignore
      event.relayUrl = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
      const tValues = getTValues(event.tags);
      tValues.forEach((t) => eventTagsSet.add(t));
    };

    const onEOSE = () => {
      // @ts-ignore
      const filteredEvents = NostrService.filterBlogEvents(events);
      const feedKey = `tag_${tagname}_${relayName}`;
      feed[feedKey] = filteredEvents;
      setEventTags(Array.from(eventTagsSet));
      setFeed(feed);
      if (filteredEvents.length > 0) {
        // @ts-ignore
        setEvents(filteredEvents);
      } else {
        setEvents([]);
      }
      if (pubkeysSet.size > 0) {
        addProfiles(Array.from(pubkeysSet));
      }
    };

    subscribe([relayUrl], filter, onEvent, onEOSE);
  };

  useEffect(() => {
    getTagEvents();
  }, [relayUrl, activeRelay]);

  return (
    <Main>
      <Content>
        <div className="flex items-center justify-start gap-2">
          <Tag size="20" />
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
        {events.length > 0 && (
          <RecommendedEvents
            title="Recommended Blogs"
            showProfile
            events={events.slice(0, 3)}
          />
        )}

        <Topics
          title="Recommended Topics"
          TOPICS={eventTags.length > 0 ? eventTags.slice(0, 7) : []}
        />
      </Aside>
    </Main>
  );
}
