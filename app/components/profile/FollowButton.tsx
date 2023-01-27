"use client";

import { NostrService } from "@/app/lib/nostr";
import { useNostr } from "nostr-react";
import { HiUserAdd, HiUserRemove } from "react-icons/hi";
import Button from "../../Button";

export default function FollowButton({
  loggedInUserPublicKey,
  currentContacts,
  profilePublicKey,
  contacts,
}: any) {
  const { publish } = useNostr();
  const { connectedRelays } = useNostr();

  let isFollowing = false;

  if (contacts) {
    isFollowing = contacts.includes(profilePublicKey);
  }

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

    let eventId: any = null;
    eventId = event?.id;

    connectedRelays.forEach((relay) => {
      let sub = relay.sub([
        {
          ids: [eventId],
        },
      ]);
      sub.on("event", (event: Event) => {
        console.log("we got the event we wanted:", event);
      });
      sub.on("eose", () => {
        console.log("EOSE");
        sub.unsub();
      });
    });

    const pubs = publish(event);

    // @ts-ignore
    for await (const pub of pubs) {
      pub.on("ok", () => {
        console.log("OUR EVENT WAS ACCEPTED");
      });

      await pub.on("seen", async () => {
        console.log("OUR EVENT WAS SEEN");
      });

      pub.on("failed", (reason: any) => {
        console.log("OUR EVENT HAS FAILED");
      });
    }
  };

  return (
    <Button
      variant={isFollowing ? "ghost" : "outline"}
      size="sm"
      icon={isFollowing ? <HiUserRemove /> : <HiUserAdd />}
      onClick={handleFollow}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
