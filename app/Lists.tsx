import { useNostr, useNostrEvents } from "nostr-react";
import { useContext, useEffect, useState } from "react";
import { KeysContext } from "./context/keys-provider";
import type { Event } from "nostr-tools";
import BlogFeed from "./BlogFeed";

const Lists: React.FC = () => {
  // @ts-ignore
  const { keys } = useContext(KeysContext);
  const { connectedRelays } = useNostr();
  const [events, setEvents] = useState<Event[]>([]);

  const profilePubkey = keys.publicKey;

  const filter = {
    kinds: [2222],
    authors: [profilePubkey],
    limit: 100,
    until: undefined,
  };

  useEffect(() => {
    if (events.length === 0) {
      const eventsSeen: { [k: string]: boolean } = {};
      let eventArray: Event[] = [];
      connectedRelays.forEach((relay) => {
        let sub = relay.sub([filter]);
        sub.on("event", (event: Event) => {
          if (!eventsSeen[event.id!]) {
            eventArray.push(event);
          }
          eventsSeen[event.id!] = true;
        });
        sub.on("eose", () => {
          // console.log("EOSE");
          // console.log("EXPLORE eventArray", eventArray);
          setEvents(eventArray);
          sub.unsub();
        });
      });
    }
  }, [connectedRelays]);

  // console.log("EVENTS FROM LISTS:", bookmarkEvents);

  return (
    <div className="py-8">
      <BlogFeed
        events={events}
        setEvents={setEvents}
        filter={filter}
        profile={false}
      />
    </div>
  );
};

export default Lists;
