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
  const [followingPubkeys, setFollowingPubkeys] = useState<string[]>([]);
  const { relayUrl, activeRelay, publish } = useContext(RelayContext);
  // @ts-ignore
  const { following, setFollowing, followingReload, setFollowingReload } =
    useContext(FollowingContext);

  // @ts-ignore
  const { keys } = useContext(KeysContext);

  useEffect(() => {
    let relayName = relayUrl.replace("wss://", "");
    let followingKey = `following_${relayName}_${keys.publicKey}`;
    const followingEvents = following[followingKey];

    if (!followingEvents) return;
    if (!following[followingKey]) return;
    const contacts = following[followingKey];
    setFollowingPubkeys(contacts);
    if (contacts.includes(profilePublicKey)) {
      setFollowButtonText("Following");
      setIsFollowing(true);
    }
  }, [relayUrl, followingReload, activeRelay]);

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

  const onOk = async () => {};

  const onFailed = async () => {};

  const handleFollow = async (e: any) => {
    e.preventDefault();
    // console.log("follow button clicked");

    let newContactList: any;
    let action: string;

    if (isFollowing) {
      const unfollowedList = followingPubkeys.filter(
        (pubkey) => pubkey !== profilePublicKey
      );

      newContactList = unfollowedList.map((pubkey) => ["p", pubkey]);

      action = "unfollowed";
    } else {
      const currentContacts = followingPubkeys.map((pubkey) => ["p", pubkey]);

      newContactList = [...currentContacts, ["p", profilePublicKey]];
      action = "followed";
    }

    let event = NostrService.createEvent(3, keys.publicKey, "", newContactList);
    event = await NostrService.signEvent(event);

    const onSeen = async () => {
      if (!activeRelay) return;

      // console.log("OUR EVENT WAS SEEN");
      let relayName = relayUrl.replace("wss://", "");
      let followingKey = `following_${relayName}_${keys.publicKey}`;

      const contacts = event.tags;
      const contactPublicKeys: string[] = contacts.map((contact: any) => {
        return contact[1];
      });

      setFollowingPubkeys(contactPublicKeys);

      following[followingKey] = contactPublicKeys;

      const newFollowing = following;
      setFollowing(newFollowing);
      if (action === "unfollowed") {
        setFollowButtonText("Follow");
        setIsFollowing(false);
      }
      if (action === "followed") {
        setFollowButtonText("Following");
        setIsFollowing(true);
      }
      setFollowingReload(!followingReload);
    };

    publish([relayUrl], event, onOk, onSeen, onFailed);
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
