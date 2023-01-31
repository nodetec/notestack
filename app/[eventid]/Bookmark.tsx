import { MdOutlineBookmarkAdd } from "react-icons/md";
import Button from "../Button";
import { Event } from "nostr-tools";
import { useNostr } from "nostr-react";
import { KeysContext } from "../context/keys-provider";
import { useContext } from "react";
import { NostrService } from "../lib/nostr";

interface BookmarkProps {
  event: Event;
}

export default function Bookmark({ event }: BookmarkProps) {
  const { connectedRelays } = useNostr();
  const { publish } = useNostr();
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const loggedInPubkey = keys?.publicKey;
  // when getting replaceable event make sure to get the newest one in the list
  // retrieve all e tags
  // append new e tags filter dupes
  // use logged in user for author
  // publish

  const handlebookmark = async () => {
    console.log("bookmark");
    // const bookmarkEvents = new Set<Event>((a: Event, b: Event) => a.equals(b));
    let bookmarkEvent: Event;
    let count = 0;
    const bookmarksSeen: { [k: string]: boolean } = {};
    let mostRecentBookMarkEvent = 0;

    console.log("connectedRelays:", connectedRelays);

    connectedRelays.forEach((relay) => {
      let sub = relay.sub([
        {
          kinds: [30000],
          authors: [loggedInPubkey],
          "#d": ["bookmarks"],
        },
      ]);
      sub.on("event", (event: Event) => {
        if (
          !bookmarksSeen[event.id!] &&
          event.created_at > mostRecentBookMarkEvent
        ) {
          bookmarkEvent = event;
          mostRecentBookMarkEvent = event.created_at;
        }
        bookmarksSeen[event.id!] = true;
        console.log("we got the event we wanted:", event);
      });
      sub.on("eose", async () => {
        count++;
        console.log("EOSE");
        console.log("relay finished:", relay);
        sub.unsub();

        if (count === connectedRelays.length) {
          console.log("bookmarkEvent", bookmarkEvent);

          const tags = bookmarkEvent.tags;

          const bookmarkEvents = tags.filter(
            (pair: string[]) => pair[0] === "e"
          );

          let newBookmarkEvent = NostrService.createEvent(
            30000,
            loggedInPubkey,
            "",
            [["d", "bookmarks"], ["e", event.id!], ...bookmarkEvents]
          );

          try {
            newBookmarkEvent = await NostrService.addEventData(
              newBookmarkEvent
            );
          } catch (err: any) {
            return;
          }

          let newBookmarkeventId: any = null;
          newBookmarkeventId = newBookmarkEvent?.id;

          // console.log("bookmarkEvents!!!!!!", bookmarkEvents);

          console.log("NEW BOOKMARK:", newBookmarkEvent);

          const pubs = publish(newBookmarkEvent);

          // @ts-ignore
          for await (const pub of pubs) {
            pub.on("ok", () => {
              console.log("OUR EVENT WAS ACCEPTED");
            });

            await pub.on("seen", async () => {
              console.log("OUR EVENT WAS SEEN");
            });

            pub.on("failed", (reason: any) => {
              console.log("OUR EVENT HAS FAILED WITH REASON:", reason);
            });
          }
        }
      });
    });
  };

  return (
    <Button
      variant="ghost"
      title="Bookmark note"
      icon={<MdOutlineBookmarkAdd />}
      onClick={handlebookmark}
    />
  );
}
