"use client";
import { useNostr } from "nostr-react";
import { Event } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import { RiDeleteBin2Line } from "react-icons/ri";
import { KeysContext } from "./context/keys-provider";
import { NostrService } from "./lib/nostr";

interface DeleteBlogProps {
  event: Event;
}

export default function DeleteBlog({ event }: DeleteBlogProps) {
  // @ts-ignore
  const { keys: loggedInUserKeys } = useContext(KeysContext);
  const { publish } = useNostr();
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
      const pubs = publish(deleteEvent);
      // @ts-ignore
      for (const pub of pubs) {
        pub.on("ok", () => {
          console.log("OUR DELETE EVENT WAS ACCEPTED");
        });

        pub.on("seen", async () => {
          console.log("OUR DELETE EVENT WAS SEEN");
          // TODO: pass event list all they into here and remove it from state after deletion event is seen
        });

        pub.on("failed", (reason: any) => {
          console.log("OUR DELETE EVENT HAS FAILED WITH REASON:", reason);
        });
      }
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
