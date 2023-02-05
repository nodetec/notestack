import { useContext, useEffect, useState } from "react";
import { Event, nip19, Relay } from "nostr-tools";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";

export default function Followers({ npub }: any) {
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  const [followers, setFollowers] = useState<Event[]>([]);

  // TODO: implement caching
  useEffect(() => {
    if (activeRelay) {
      const profilePubkey = nip19.decode(npub).data.valueOf();
      let eventArray: Event[] = [];
      let sub = activeRelay.sub([
        {
          kinds: [3],
          "#p": [profilePubkey],
          limit: 100,
        },
      ]);

      sub.on("event", (event: Event) => {
        eventArray.push(event);
      });

      sub.on("eose", () => {
        console.log("EOSE additional events from", activeRelay.url);
        const filteredEvents = NostrService.filterEvents(eventArray);
        if (filteredEvents.length > 0) {
          setFollowers(filteredEvents);
        } else {
          setFollowers([]);
        }
        sub.unsub();
      });
    }
  }, [activeRelay]);

  return (
    <div
      // className="text-base text-gray hover:text-gray-hover my-2"
      className="text-base text-gray my-2"
      // href={`/u/${npub}`}
    >
      {followers && followers.length > 100 ? "100+" : followers.length}{" "}
      Followers
    </div>
  );
}
