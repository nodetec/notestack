"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import { shortenHash } from "@/app/lib/utils";
import type { Event, Relay } from "nostr-tools";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import { usePathname } from "next/navigation";
import { nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import AuthorTooltip from "@/app/AuthorTooltip";
import { NostrService } from "@/app/lib/nostr";
import { RelayContext } from "@/app/context/relay-provider";
import FollowedRelays from "@/app/FollowedRelays";

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
  const [contactEvents, setContactEvents] = useState<Event[]>([]);
  // @ts-ignore
  const { connectedRelays, activeRelays } = useContext(RelayContext);

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

      if (events.length === 0) {
        const profileEventsString = sessionStorage.getItem(
          profilePubkey + "_events"
        );
        if (profileEventsString) {
          const cachedEvents = JSON.parse(profileEventsString);
          setEvents(cachedEvents);
          console.log("using cached events for user:", npub);
        }
      }
    }, []);

    useEffect(() => {
      const profileEventsString = sessionStorage.getItem(
        profilePubkey + "_events"
      );
      if (!profileEventsString && events.length === 0) {
        const eventsSeen: { [k: string]: boolean } = {};
        let eventArray: Event[] = [];
        connectedRelays.forEach((relay: Relay) => {
          let sub = relay.sub([filter]);
          sub.on("event", (event: Event) => {
            if (!eventsSeen[event.id!]) {
              eventArray.push(event);
            }
            eventsSeen[event.id!] = true;
          });
          sub.on("eose", () => {
            console.log("EOSE initial latest profile events from", relay.url);
            const filteredEvents = NostrService.filterBlogEvents(eventArray);
            if (filteredEvents.length > 0) {
              setEvents(filteredEvents);
              const eventsString = JSON.stringify(filteredEvents);
              sessionStorage.setItem(profilePubkey + "_events", eventsString);
            }
            sub.unsub();
          });
        });
      }

      const authors: any = [profilePubkey];
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay: Relay) => {
        let sub = relay.sub([
          {
            kinds: [3],
            authors,
            limit: 5,
          },
        ]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          console.log("EOSE initial latest profile events from", relay.url);
          const filteredEvents = NostrService.filterBlogEvents(eventArray);
          if (filteredEvents.length > 0) {
            setContactEvents(filteredEvents);
            console.log("CONTACT EVENTS:", filteredEvents);
            const eventsString = JSON.stringify(filteredEvents);
            sessionStorage.setItem(profilePubkey + "_events", eventsString);
          }
          sub.unsub();
        });
      });
    }, [activeRelays]);

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
