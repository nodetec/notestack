"use client";
import { useContext, useEffect, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Button from "./Button";
import { DUMMY_PROFILE_API } from "./lib/constants";
import ProfileMenu from "./ProfileMenu";
import type { Event, Relay } from "nostr-tools";
import { UserContext } from "./context/user-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";
import { FollowingContext } from "./context/following-provider";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [picture, setPicture] = useState(DUMMY_PROFILE_API(pubkey));

  // @ts-ignore
  const { user, setUser } = useContext(UserContext);

  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { following, setFollowing, followingReload, setFollowingReload } =
    useContext(FollowingContext);

  useEffect(() => {
    if (activeRelay) {
      let relayUrl = activeRelay.url.replace("wss://", "");
      let kinds = [0, 3];

      let userKey = `user_${relayUrl}`;
      if (user[userKey]) {
        kinds = kinds.filter((kind) => kind !== 3);
        // console.log("Cached events from context");
        const content = user[userKey].content;
        if (content) {
          const contentObj = JSON.parse(content);
          if (contentObj.picture) {
            setPicture(contentObj.picture);
          }
        }
      }

      let followingKey = `following_${relayUrl}_${pubkey}`;

      if (following[followingKey]) {
        kinds = kinds.filter((kind) => kind !== 0);
      }

      if (kinds.length === 0) {
        return;
      }

      let sub = activeRelay.sub([
        {
          kinds,
          authors: [pubkey],
        },
      ]);
      let events: Event[] = [];

      sub.on("event", (event: Event) => {
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
        if (event.kind === 0) {
          const profileMetadata = event;
          user[userKey] = profileMetadata;
          setUser(user);
          const content = event.content;
          if (content) {
            const contentObj = JSON.parse(content);
            if (contentObj.picture) {
              setPicture(contentObj.picture);
            }
          }
        }
      });

      sub.on("eose", () => {
        if (events.length !== 0) {
          // filter through events for kind 3
          const followingEvents = events.filter((event) => event.kind === 3);
          let followingKey = `following_${relayUrl}_${pubkey}`;
          following[followingKey] = followingEvents;
          const newFollowing = following;
          setFollowing(newFollowing);
          setFollowingReload(!followingReload);

          sub.unsub();
        }
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
