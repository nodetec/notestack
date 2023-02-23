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
import { DUMMY_PROFILE_API } from "@/app/lib/constants";

export default function ProfilePage() {
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const pathname = usePathname();
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  // @ts-ignore
  const { feed, setFeed } = useContext(FeedContext);
  // @ts-ignore
  const { addProfiles, profiles, reload } = useContext(ProfilesContext);
  // const { profile } = useContext(ProfileContext);

  const { relayUrl, subscribe } = useContext(RelayContext);

  // const [name, setName] = useState<string>();
  // const [about, setAbout] = useState<string>("");

  if (pathname && pathname.length < 60 && pathname !== null) {
    return <p>Profile not found</p>;
  }

  const npub = pathname!.split("/").pop() || "";
  // const [name, setName] = useState();
  // const [about, setAbout] = useState();
  const [picture, setPicture] = useState<string>(DUMMY_PROFILE_API(npub));
  const [profile, setProfile] = useState({
    name: "",
    about: "",
    picture: "",
    banner: "",
  });

  const resetProfile = () => {
    setProfile({
      name: "",
      about: "",
      picture: "",
      banner: "",
    });
  };

  let profilePubkey = "";
  const filter = {
    kinds: [30023],
    authors: [profilePubkey],
    limit: 50,
    until: undefined,
  };

  return (
    <Main>
      <Content>
        {profile.banner && profile.banner !== "" && (
          <img
            className="rounded-md w-full h-full object-cover my-4"
            src={profile.banner}
            alt={""}
          />
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-row items-center gap-2">
            <img
              className="rounded-full w-11 h-11 object-cover md:hidden"
              src={picture}
              alt={""}
            />
            <h1 className="md:text-5xl font-medium my-8 md:my-12">
              {profile.name}
            </h1>
          </div>
          <div className="hidden md:flex">
            <AuthorTooltip npub={npub} />
          </div>
        </div>
        <FollowedRelays />
        <Tabs TABS={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "Home" ? (
          <BlogFeed
            events={events}
            setEvents={setEvents}
            filter={filter}
            profile={false}
            isEventsLoading={isEventsLoading}
            profilePublicKey={profilePubkey}
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

