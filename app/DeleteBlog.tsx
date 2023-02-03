"use client";
import { Event, Relay } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { KeysContext } from "./context/keys-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";

interface DeleteBlogProps {
  event: Event;
}

export default function DeleteBlog({ event }: DeleteBlogProps) {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  // @ts-ignore
  const { connectedRelays } = useContext(RelayContext);
  const [eventToDelete, setEventToDelete] = useState<any>(null);

  useEffect(() => {
    setEventToDelete(event);
  }, []);

  const handleDelete = async (e: any) => {
    e.preventDefault();
    const tags = [["e", eventToDelete.id]];
    console.log("EVENT TO DELETE:", eventToDelete);

    let deleteEvent = NostrService.createEvent(
      5,
      loggedInUserKeys.publicKey,
      "",
      tags
    );

    try {
      deleteEvent = await NostrService.addEventData(deleteEvent);
      connectedRelays.forEach((relay: Relay) => {
        let pub = relay.publish(event);
        pub.on("ok", () => {
          console.log(`DELETE EVENT WAS ACCEPTED by ${relay.url}`);
        });
        pub.on("seen", () => {
          console.log(`DELETE EVENT WAS SEEN ON ${relay.url}`);
        });
        pub.on("failed", (reason: string) => {
          console.log(
            `OUR DELETE EVENT HAS FAILED WITH REASON: ${relay.url}: ${reason}`
          );
        });
      });
    } catch (err: any) {
      console.log("FAILED TO DELETE");
    }
  };

  return (
    <>
      {event.pubkey === loggedInUserKeys.publicKey && (
        <button className="p-1 text-gray rounded-lg" onClick={handleDelete}>
          <RiDeleteBin2Line size={15} />
        </button>
      )}
    </>
  );
}
