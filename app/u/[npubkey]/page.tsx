"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import { shortenHash } from "@/app/lib/utils";
import type { Event } from "nostr-tools";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import AuthorTooltip from "@/app/AuthorTooltip";
import { NostrService } from "@/app/lib/nostr";
import { RelayContext } from "@/app/context/relay-provider";
import FollowedRelays from "@/app/FollowedRelays";
import { FeedContext } from "@/app/context/feed-provider";
import { ProfilesContext } from "@/app/context/profiles-provider";

export default function ProfilePage() {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
  });
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const pathname = usePathname();
  const [events, setEvents] = useState<Event[]>([]);
  // @ts-ignore
  const { activeRelay, pendingActiveRelayUrl } = useContext(RelayContext);
  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);
  // @ts-ignore
  const { setpubkeys } = useContext(ProfilesContext);

  if (pathname) {
    const npub = pathname.split("/").pop() || "";
    const profilePubkey = nip19.decode(npub).data.toString();
    const filter = {
      kinds: [2222],
      authors: [profilePubkey],
      limit: 50,
      until: undefined,
    };

    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
      let pubkeysSet = new Set<string>();

      if (activeRelay && pendingActiveRelayUrl === activeRelay.url) {
        setEvents([]);
        let relayUrl = activeRelay.url.replace("wss://", "");
        let feedKey = `profilefeed_${relayUrl}_${profilePubkey}`;

        if (feed[feedKey]) {
          setEvents(feed[feedKey]);
        } else {
          console.log("Getting events from relay");
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
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-5xl font-medium my-12">
              {profileInfo.name || shortenHash(npub)}
            </h1>
            <AuthorTooltip npub={npub} />
          </div>
          <FollowedRelays />
          <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === "Home" ? (
            <BlogFeed
              events={events}
              setEvents={setEvents}
              filter={filter}
              profile={false}
            />
          ) : activeTab === "About" ? (
            <About about={profileInfo.about} />
          ) : null}
        </Content>

        <Aside>
          <Profile npub={npub} setProfileInfo={setProfileInfo} />
        </Aside>
      </Main>
    );
  } else {
    return <p>Profile not found</p>;
  }
}
