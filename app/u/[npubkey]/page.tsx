"use client";

import About from "@/app/About";
import Aside from "@/app/Aside";
import BlogFeed from "@/app/BlogFeed";
import Button from "@/app/Button";
import Profile from "@/app/components/profile/Profile";
import Content from "@/app/Content";
import { NotifyContext } from "@/app/context/notify-provider";
import useCopy from "@/app/hooks/useCopy";
import { shortenHash } from "@/app/lib/utils";
import type { Event } from "nostr-tools";
import Main from "@/app/Main";
import Tabs from "@/app/Tabs";
import Tooltip from "@/app/Tooltip";
import { usePathname } from "next/navigation";
import { useNostr } from "nostr-react";
import { nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { BiDotsHorizontalRounded } from "react-icons/bi";

export default function ProfilePage() {
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    about: "",
    picture: "",
  });
  const TABS = ["Home", "About"];
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [showTooltip, setShowTooltip] = useState(false);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);
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
      if (isCopied) {
        setNotifyMessage("Link copied");
      }
      if (isError) {
        setNotifyMessage("Error copying link");
      }
    }, [isCopied, isError, setNotifyMessage]);

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
            // console.log("EOSE");
            // console.log("EXPLORE eventArray", eventArray);
            setEvents(eventArray);
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
            <Tooltip
              direction="bottom"
              show={showTooltip}
              toggle={() => setShowTooltip((current) => !current)}
              Component={
                <Button
                  color="transparent"
                  variant="ghost"
                  size="sm"
                  icon={<BiDotsHorizontalRounded size="24" />}
                />
              }
            >
              <div className="flex flex-col gap-3 w-max">
                <Button
                  variant="ghost"
                  color="transparent"
                  size="xs"
                  onClick={() => {
                    copyToClipboard(npub);
                    setShowTooltip(false);
                  }}
                >
                  Copy link to profile
                </Button>
                <Button
                  color="transparent"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setNotifyMessage("click the ⚡ button under the user card");
                    setShowTooltip(false);
                  }}
                >
                  Support this author
                </Button>
              </div>
            </Tooltip>
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
