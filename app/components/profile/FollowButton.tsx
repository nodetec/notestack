"use client";

import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import { Relay } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Button from "../../Button";

export default function FollowButton({
  loggedInUserPublicKey,
  currentContacts,
  profilePublicKey,
  contacts,
}: any) {
  const [isFollowing, setIsFollowing] = useState(false);
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  useEffect(() => {
    if (contacts) {
      setIsFollowing(contacts.includes(profilePublicKey));
    }
  }, [contacts]);

  const handleFollow = async (e: any) => {
    e.preventDefault();

    let newContactList;

    if (isFollowing) {
      newContactList = currentContacts.filter(
        (pair: string) => pair[1] !== profilePublicKey
      );
    } else {
      newContactList = [...currentContacts, ["p", profilePublicKey]];
    }

    let event = NostrService.createEvent(
      3,
      loggedInUserPublicKey,
      "",
      newContactList
    );

    try {
      event = await NostrService.addEventData(event);
    } catch (err: any) {
      return;
    }

    if (!activeRelay) {
      console.log("relay not active!");
      return;
      // TODO: handle this
    }
    let pub = activeRelay.publish(event);
    pub.on("ok", () => {
      console.log("OUR EVENT WAS ACCEPTED");
    });
    pub.on("seen", () => {
      console.log("OUR EVENT WAS SEEN");
    });
    pub.on("failed", (reason: string) => {
      console.log("OUR EVENT HAS FAILED BECAUSE:", reason);
    });
  };

  return (
    <Button
      color="red"
      variant={isFollowing ? "outline" : "solid"}
      size="sm"
      onClick={handleFollow}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
