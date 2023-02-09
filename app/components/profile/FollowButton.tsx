"use client";

import { FollowingContext } from "@/app/context/following-provider";
import { KeysContext } from "@/app/context/keys-provider";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import { useContext, useEffect, useState } from "react";
import Button from "../../Button";

export default function FollowButton({ profilePublicKey }: any) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followButtonText, setFollowButtonText] = useState("Follow");
  const [currentContacts, setCurrentContacts] = useState([]);
  // @ts-ignore
  const { relayUrl, activeRelay } = useContext(RelayContext);
  // @ts-ignore
  const { following, setFollowing, followingReload, setFollowingReload } =
    useContext(FollowingContext);

  // @ts-ignore
  const { keys } = useContext(KeysContext);

  useEffect(() => {
    let relayName = relayUrl.replace("wss://", "");
    let followingKey = `following_${relayName}_${keys.publicKey}`;
    const followingEvents = following[followingKey];
    let followingPublicKeys: string[] = [];
    if (followingEvents) {
      if (!following[followingKey]) return;
      const contacts = following[followingKey][0].tags;
      setCurrentContacts(contacts);

      followingPublicKeys = contacts.map((contact: any) => {
        return contact[1];
      });

      if (followingPublicKeys.includes(profilePublicKey)) {
        setFollowButtonText("Following");
        setIsFollowing(true);
      }
    }
  }, [relayUrl, followingReload]);

  const handleHover = async (e: any) => {
    e.preventDefault();
    if (isFollowing) {
      setFollowButtonText("Unfollow");
    }
  };

  const handleMouseOut = async (e: any) => {
    e.preventDefault();
    if (isFollowing) {
      setFollowButtonText("Following");
    } else {
      setFollowButtonText("Follow");
    }
  };

  const handleFollow = async (e: any) => {
    e.preventDefault();
    // console.log("follow button clicked");

    let newContactList: any;

    let action = "";

    if (isFollowing) {
      newContactList = currentContacts.filter(
        (pair: string) => pair[1] !== profilePublicKey
      );
      action = "unfollowed";
    } else {
      newContactList = [...currentContacts, ["p", profilePublicKey]];
      action = "followed";
    }

    let event = NostrService.createEvent(3, keys.publicKey, "", newContactList);

    console.log("event", event);

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    const relay = await NostrService.connect(relayUrl, activeRelay);
    if (!relay) return;

    let pub = relay.publish(event);
    pub.on("ok", () => {
      // console.log("OUR EVENT WAS ACCEPTED");
    });
    pub.on("seen", () => {
      // console.log("OUR EVENT WAS SEEN");
      let relayName = relayUrl.replace("wss://", "");
      let followingKey = `following_${relayName}_${keys.publicKey}`;
      following[followingKey] = [event];
      const newFollowing = following;
      setFollowing(newFollowing);
      setCurrentContacts(newContactList);
      if (action === "unfollowed") {
        setFollowButtonText("Follow");
        setIsFollowing(false);
      }
      if (action === "followed") {
        setFollowButtonText("Following");
        setIsFollowing(true);
      }
    });
    pub.on("failed", (reason: string) => {
      // console.log("OUR EVENT HAS FAILED BECAUSE:", reason);
    });
  };

  return (
    <Button
      color="red"
      variant={isFollowing ? "outline" : "solid"}
      size="sm"
      onClick={handleFollow}
      onMouseOver={handleHover}
      onMouseOut={handleMouseOut}
    >
      {followButtonText}
    </Button>
  );
}
