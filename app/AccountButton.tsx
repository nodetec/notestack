"use client";
import { useContext, useEffect, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import Button from "./Button";
import { DUMMY_PROFILE_API } from "./lib/constants";
import ProfileMenu from "./ProfileMenu";
import { Event, nip19 } from "nostr-tools";
import { UserContext } from "./context/user-provider";
import { RelayContext } from "./context/relay-provider";
import { FollowingContext } from "./context/following-provider";

interface AccountButtonProps {
  pubkey: string;
}

export default function AccountButton({ pubkey }: AccountButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [picture, setPicture] = useState(
    DUMMY_PROFILE_API(nip19.npubEncode(pubkey))
  );

  // @ts-ignore
  const { user, setUser } = useContext(UserContext);

  // @ts-ignore
  const { relayUrl, activeRelay, connect } = useContext(RelayContext);

  // @ts-ignore
  const { following, setFollowing, followingReload, setFollowingReload } = useContext(FollowingContext);

  const getEvents = async () => {
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

    let relayName = relayUrl.replace("wss://", "");

    const relay = await connect(relayUrl, activeRelay);
    if (!relay) return;

    let sub = relay.sub([
      {
        kinds,
        authors: [pubkey],
        limit: 5,
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
        let followingKey = `following_${relayName}_${pubkey}`;

        const contacts = followingEvents[0].tags;
        const contactPublicKeys = contacts.map((contact: any) => {
          return contact[1];
        });

        following[followingKey] = contactPublicKeys;
        setFollowing(following);
        // addProfiles(contactPublicKeys.slice(0, 5));
        setFollowingReload(!followingReload);
        sub.unsub();
      }
    });
  };

  useEffect(() => {
    getEvents();
  }, [relayUrl, activeRelay]);

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
