"use client";
import { Event, Relay } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { KeysContext } from "./context/keys-provider";
import { NotifyContext } from "./context/notify-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";

interface DeleteBlogProps {
  event: Event;
}

export default function DeleteBlog({ event }: DeleteBlogProps) {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const { setNotifyMessage } = useContext(NotifyContext);

  useEffect(() => {
    setEventToDelete(event);
  }, []);

  const handleDelete = async (e: any) => {
    e.preventDefault();
    const tags = [["e", eventToDelete.id]];
    // console.log("EVENT TO DELETE:", eventToDelete);

    let deleteEvent = NostrService.createEvent(
      5,
      loggedInUserKeys.publicKey,
      "",
      tags
    );
    try {
      deleteEvent = await NostrService.addEventData(deleteEvent);
      if (activeRelay) {
        let pub = activeRelay.publish(event);
        pub.on("ok", () => {
          // console.log(`DELETE EVENT WAS ACCEPTED by ${activeRelay.url}`);
        });
        pub.on("seen", () => {
          // console.log(`DELETE EVENT WAS SEEN ON ${activeRelay.url}`);
        });
        pub.on("failed", (reason: string) => {
          setNotifyMessage("Delete failed!");
          // console.log(
          //   `OUR DELETE EVENT HAS FAILED WITH REASON: ${activeRelay.url}: ${reason}`
          // );
        });
      } else {
        // console.log("relay not active!");
        // TODO: handle this
      }
    } catch (err: any) {
      // console.log("FAILED TO DELETE");
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
