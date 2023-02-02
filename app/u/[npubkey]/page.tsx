"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import { getTagValues, shortenHash } from "@/app/lib/utils";
import type { Event } from "nostr-tools";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { useNostr } from "nostr-react";
import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";
import AuthorTooltip from "@/app/AuthorTooltip";

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
  const { connectedRelays } = useNostr();
  if (pathname) {
    const npub = pathname.split("/").pop() || "";
    const profilePubkey = nip19.decode(npub).data.toString();
    const filter = {
      kinds: [2222],
      authors: [profilePubkey],
      limit: 100,
      until: undefined,
    };

    useEffect(() => {
      if (events.length === 0) {
        const eventsSeen: { [k: string]: boolean } = {};
        let eventArray: Event[] = [];
        connectedRelays.forEach((relay) => {
          let sub = relay.sub([filter]);
          sub.on("event", (event: Event) => {
            if (!eventsSeen[event.id!]) {
              eventArray.push(event);
            }
            eventsSeen[event.id!] = true;
          });
          sub.on("eose", () => {
            console.log("EOSE initial latest profile events from", relay.url);
            const filteredEvents = eventArray.filter((e1, index) => {
              if (e1.content === "") {
                return false;
              }
              const title = getTagValues("subject", e1.tags);
              if (!title || title === "") {
                return false;
              }
              return eventArray.findIndex((e2) => e2.id === e1.id) === index;
            });
            if (filteredEvents.length > 0) {
              setEvents(filteredEvents);
            }
            sub.unsub();
          });
        });
      }
    }, [connectedRelays]);
    // }, []);

    return (
      <Main>
        <Content>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-5xl font-medium my-12">
              {profileInfo.name || shortenHash(npub)}
            </h1>
            <AuthorTooltip npub={npub} />
          </div>
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
