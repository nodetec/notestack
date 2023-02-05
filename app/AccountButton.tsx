"use client";
import { useContext, useEffect, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Button from "./Button";
import { DUMMY_PROFILE_API } from "./lib/constants";
import ProfileMenu from "./ProfileMenu";
import type { Event, Relay } from "nostr-tools";
import { UserContext } from "./context/user-provider";
import { RelayContext } from "./context/relay-provider";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [picture, setPicture] = useState(DUMMY_PROFILE_API(pubkey));

  // @ts-ignore
  const { setUser } = useContext(UserContext);

  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  useEffect(() => {
    if (activeRelay) {
      let sub = activeRelay.sub([
        {
          kinds: [0],
          authors: [pubkey],
        },
      ]);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let events: Event[] = [];

      sub.on("event", (event: Event) => {
        console.log("DO WE GET HERE?");
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
      });

      sub.on("eose", () => {
        if (events.length !== 0) {
          const profileMetadata = events[0];
          setUser(profileMetadata);
          const content = events[0].content;
          if (content) {
            const contentObj = JSON.parse(content);
            setPicture(contentObj.picture);
          }
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

  return (
    <div className="relative">
      <Button
        color="transparent"
        variant="ghost"
        size="xs"
        icon={<IoChevronDown />}
        iconAfter
        className="flex items-center gap-2 text-gray hover:text-gray-hover p-0"
        onClick={() => setShowMenu((currrent) => !currrent)}
      >
        <span className="rounded-full">
          <img
            className="rounded-full w-8 h-8 object-cover"
            src={picture}
            alt=""
          />
        </span>
      </Button>
      {showMenu && <ProfileMenu toggleMenu={setShowMenu} pubkey={pubkey} />}
    </div>
  );
}
