"use client";
import { useNostr } from "nostr-react";
import { useContext, useEffect, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Button from "./Button";
import { DUMMY_PROFILE_API } from "./lib/constants";
import ProfileMenu from "./ProfileMenu";
import type { Event } from "nostr-tools";
import { UserContext } from "./context/user-provider";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { connectedRelays } = useNostr();
  const [picture, setPicture] = useState(DUMMY_PROFILE_API(pubkey));

  // @ts-ignore
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem(pubkey + "_user");

    try {
      if (cachedUser) {
        const contentObj = JSON.parse(cachedUser);
        setPicture(contentObj.picture);
      }
    } catch (e) {
      console.log("error parsing cached user profile", e);
    }

    if (cachedUser) {
      const profileMetadata = JSON.parse(cachedUser);
      setUser(profileMetadata);
      console.log("using cached user profile:", profileMetadata);
    } else {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay) => {
        let sub = relay.sub([
          {
            kinds: [0],
            authors: [pubkey],
          },
        ]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          console.log("EOSE initial latest events from", relay.url);
          sub.unsub();
          console.log("PROFILE EVENT ARRAY", eventArray);

          if (eventArray.length !== 0) {
            // TODO: just grab the first one for now in the future check the content
            const profileMetadata = eventArray[0];
            setUser(profileMetadata);
            const profileString = JSON.stringify(profileMetadata);
            sessionStorage.setItem(pubkey + "_user", profileString);
            const content = eventArray[0].content;
            if (content) {
              const contentObj = JSON.parse(content);
              setPicture(contentObj.picture);
            }
          }
        });
      });
    }
  }, [connectedRelays]);

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
