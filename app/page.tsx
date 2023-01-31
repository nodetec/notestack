"use client";
import { useNostr } from "nostr-react";
import { useContext, useEffect, useState } from "react";
import { HiUserAdd } from "react-icons/hi";
import { ImSearch } from "react-icons/im";
import type { Event, Filter } from "nostr-tools";
import Aside from "./Aside";
import BlogFeed from "./BlogFeed";
import Button from "./Button";
import Content from "./Content";
import { KeysContext } from "./context/keys-provider";
import Main from "./Main";
import RecommendedEvents from "./RecommendedEvents";
import RecommendedTopics from "./RecommendedTopics";

export default function HomePage() {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  const exploreFilter = {
    kinds: [2222],
    limit: 100,
    authors: undefined,
    until: undefined,
  };
  const [exploreEvents, setExploreEvents] = useState<Event[]>([]);
  const [followingEvents, setFollowingEvents] = useState<Event[]>([]);
  const [followingFilter, setFollowingFilter] = useState<Filter>();

  const { connectedRelays } = useNostr();
  const [activeTab, setActiveTab] = useState<string>("explore");

  useEffect(() => {
    if (exploreEvents.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay) => {
        let sub = relay.sub([exploreFilter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;

          eventArray.push(event);
        });
        sub.on("eose", () => {
          // console.log("EOSE");
          // console.log("EXPLORE eventArray", eventArray);
          setExploreEvents(eventArray);
          sub.unsub();
        });
      });
    }

    if (followingEvents.length === 0) {
      let followedAuthors: string[];

      connectedRelays.forEach((relay) => {
        let sub = relay.sub([
          {
            authors: [loggedInUserKeys.publicKey],
            kinds: [3],
            limit: 100,
          },
        ]);
        sub.on("event", (event: Event) => {
          // TODO: we could go through each event and add each lis of followers to a set, but for now we'll just use one
          followedAuthors = event.tags.map((pair: string[]) => pair[1]);
          // console.log("followedAuthors", followedAuthors);
        });
        sub.on("eose", () => {
          console.log("EOSE");

          const newfollowingFilter = {
            kinds: [2222],
            limit: 100,
            authors: followedAuthors,
            until: undefined,
          };

          setFollowingFilter(newfollowingFilter);

          const eventsSeen: { [k: string]: boolean } = {};
          let eventArray: Event[] = [];
          connectedRelays.forEach((relay) => {
            let sub = relay.sub([newfollowingFilter]);
            sub.on("event", (event: Event) => {
              if (!eventsSeen[event.id!]) {
                eventArray.push(event);
              }
              eventsSeen[event.id!] = true;
            });
            sub.on("eose", () => {
              // console.log("EOSE");
              // console.log("FOLLOWING eventArray", eventArray);
              setFollowingEvents(eventArray);
              sub.unsub();
            });
          });
          sub.unsub();
        });
      });
    }
  }, [connectedRelays]);

  function handleExploreFilter(e: any) {
    e.preventDefault();
    setActiveTab("explore");
  }

  function handleFollowFilter(e: any) {
    e.preventDefault();
    setActiveTab("following");
  }

  return (
    <Main>
      <Content>
        <div className="flex gap-2 rounded-md p-2 mt-16">
          <Button
            variant={activeTab === "explore" ? "solid" : "ghost"}
            onClick={handleExploreFilter}
            size="sm"
            icon={<ImSearch />}
            className="w-full"
          >
            explore
          </Button>
          <Button
            variant={activeTab === "following" ? "solid" : "ghost"}
            onClick={handleFollowFilter}
            icon={<HiUserAdd />}
            size="sm"
            className="w-full"
          >
            following
          </Button>
        </div>

        {activeTab === "explore" && (
          <BlogFeed
            events={exploreEvents}
            setEvents={setExploreEvents}
            filter={exploreFilter}
            profile={true}
          />
        )}
        {activeTab === "following" && (
          <BlogFeed
            events={followingEvents}
            setEvents={setFollowingEvents}
            filter={followingFilter}
            profile={true}
          />
        )}

        {/* <BlogFeed filter={initialFilter} profile={true} /> */}
      </Content>
      <Aside>
        <RecommendedEvents
          title="Recommended Blogs"
          showProfile
          EVENTS={[
            "616c252e86c5488faf65b5247800b517f00c658b528435bde12c481c4c0b3f37",
            "f09bb957509a5bcf902e3aa0d8ba6dacfb365595ddcc9a28bc895f0b93be4f79",
            "112f5761e3206b90fc2a5d35b0dd8a667be2ce62721e565f6b1285205d5a8e27",
          ]}
        />
        <RecommendedTopics
          TOPICS={[
            "nostr",
            "Lightning",
            "blogstack",
            "Programming",
            "TailwindCSS",
            "Chess",
          ]}
        />
      </Aside>
    </Main>
  );
}
