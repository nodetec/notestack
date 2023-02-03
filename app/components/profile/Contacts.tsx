import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import Link from "next/link";
import { Event, Relay } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Contact from "./Contact";

export default function Contacts({ userContacts, npub }: any) {
  // @ts-ignore
  const { connectedRelays } = useContext(RelayContext);
  const [events, setEvents] = useState<Event[]>();

  useEffect(() => {
    const contactPublicKeys = userContacts.map((contact: any) => {
      return contact[1];
    });

    const eventsSeen: { [k: string]: boolean } = {};
    let eventArray: Event[] = [];

    connectedRelays.forEach((relay: Relay) => {
      let sub = relay.sub([
        {
          kinds: [0],
          authors: contactPublicKeys,
          limit: 5,
        },
      ]);

      sub.on("event", (event: Event) => {
        if (!eventsSeen[event.id!]) {
          eventArray.push(event);
        }
        eventsSeen[event.id!] = true;
      });

      sub.on("eose", () => {
        console.log("EOSE additional events from", relay.url);
        const filteredEvents = NostrService.filterEvents(eventArray);
        if (filteredEvents.length > 0) {
          setEvents(filteredEvents);
        }
        sub.unsub();
      });
    });
  }, [connectedRelays]);

  // let uniqueContacts = contacts.filter(
  //   (obj, index, self) =>
  //     index === self.findIndex((t) => t.pubkey === obj.pubkey)
  // );
  const followingsCount = userContacts.length;

  return (
    <div className="flex flex-col gap-4 pt-10">
      <h4 className="text-sm font-bold">Following</h4>
      <ul className="flex flex-col gap-2">
        {events &&
          events
            .slice(0, 5)
            .map((contact: any) => (
              <Contact
                key={contact.id}
                followingsCount={followingsCount}
                contact={contact}
              />
            ))}
      </ul>
      <Link
        href={`/${npub}/following`}
        className="text-gray hover:text-gray-hover text-xs"
      >
        See all ({followingsCount})
      </Link>
    </div>
  );
}
