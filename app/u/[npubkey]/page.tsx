"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Content from "@/app/Content";
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
import UserCard from "@/app/components/profile/UserCard";
import Following from "@/app/components/profile/Following";

export default function ProfilePage() {
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const pathname = usePathname();
  const [events, setEvents] = useState<Event[]>([]);
  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);
  // @ts-ignore
  const { addProfiles, profiles, reload } = useContext(ProfilesContext);
  // const { profile } = useContext(ProfileContext);
  // @ts-ignore
  const { activeRelay, relayUrl } = useContext(RelayContext);


  // const [name, setName] = useState<string>();
  // const [about, setAbout] = useState<string>("");

  if (pathname && pathname.length < 60 && pathname !== null) {
    return <p>Profile not found</p>;
  }

  const npub = pathname!.split("/").pop() || "";
  // const [name, setName] = useState();
  // const [about, setAbout] = useState();
  const [profile, setProfile] = useState({
    name: "",
    about: "",
  });
  let profilePubkey = "";
  try {
    profilePubkey = nip19.decode(npub).data.toString();
  } catch (e) {
    return <p>Profile not found</p>;
  }
  const filter = {
    kinds: [30023],
    authors: [profilePubkey],
    limit: 50,
    until: undefined,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getProfileEvents = async () => {
    let pubkeysSet = new Set<string>();

    setEvents([]);
    let relayName = relayUrl.replace("wss://", "");
    let feedKey = `profilefeed_${relayUrl}_${profilePubkey}`;

    if (feed[feedKey]) {
      setEvents(feed[feedKey]);
      return;
    }

    const relay = await NostrService.connect(relayUrl, activeRelay);
    if (!relay) return;
    let sub = relay.sub([filter]);

    let events: Event[] = [];

    sub.on("event", (event: Event) => {
      // @ts-ignore
      event.relayName = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    });

    sub.on("eose", () => {
      const filteredEvents = NostrService.filterBlogEvents(events);
      let feedKey = `profilefeed_${relayUrl}_${profilePubkey}`;
      feed[feedKey] = filteredEvents;
      setFeed(feed);
      if (filteredEvents.length > 0) {
        setEvents(filteredEvents);
      } else {
        setEvents([]);
      }
      if (pubkeysSet.size > 0) {
        // setpubkeys([...Array.from(pubkeysSet), ...pubkeys]);
        addProfiles(Array.from(pubkeysSet));
      }
      sub.unsub();
    });
  };

  const getProfile = () => {
    let relayName = relayUrl.replace("wss://", "");
    const profileKey = `profile_${relayName}_${profilePubkey}`;
    const profile = profiles[profileKey];
    if (!profile) {
      addProfiles([profilePubkey]);
    }
    if (profile && profile.content) {
      const profileContent = JSON.parse(profile.content);
      setProfile(profileContent);
    }
  };

  // look up blogs
  // look up profile
  useEffect(() => {
    getProfileEvents();
  }, [relayUrl]);

  useEffect(() => {
    getProfile();
  }, [relayUrl, reload]);


  return (
    <Main>
      <Content>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-5xl font-medium my-12">
            {profile.name}
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
          <About about={profile.about} />
        ) : null}
      </Content>
      <Aside>
        <UserCard npub={npub} profile={profile} />
        <Following npub={npub} />
      </Aside>
    </Main>
  );
}
