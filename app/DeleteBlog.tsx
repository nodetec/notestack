"use client";
import { Event } from "nostr-tools";
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
  const { relayUrl, publish } = useContext(RelayContext);
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

    deleteEvent = await NostrService.signEvent(deleteEvent);

    const onOk = async () => {};

    const onSeen = async () => {};

    const onFailed = async () => {
      setNotifyMessage("Delete failed!");
    };

    publish([relayUrl], deleteEvent, onOk, onSeen, onFailed);
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
