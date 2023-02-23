"use client";
import { Event } from "nostr-tools";
import { useContext } from "react";
import Button from "./Button";
import { KeysContext } from "./context/keys-provider";
import { NotifyContext } from "./context/notify-provider";
import { RelayContext } from "./context/relay-provider";
import { NostrService } from "./lib/nostr";

interface BookmarkEventProps {
  event: Event;
}

const BookmarkBlog = ({ event }: BookmarkEventProps) => {
  const { publicKey: loggedInUserPublicKey } = useContext(KeysContext);
  const { relayUrl, publish } = useContext(RelayContext);
  const { setNotifyMessage } = useContext(NotifyContext);

  const handleBookmark = async () => {
    const d = [event.id];
    const tags = [["a", `${30023}:${event.pubkey}:${d}`, relayUrl]];

    let bookmarkEvent = NostrService.createEvent(
      30023,
      //@ts-ignore
      loggedInUserPublicKey,
      "",
      tags
    );

    bookmarkEvent = await NostrService.signEvent(bookmarkEvent);

    const onOk = async () => {};

    const onSeen = async () => {};

    const onFailed = async () => {
      setNotifyMessage("Bookmark failed!");
    };

    publish([relayUrl], bookmarkEvent, onOk, onSeen, onFailed);
  };

  return <Button onClick={handleBookmark}>bookmark</Button>;
};

export default BookmarkBlog;
