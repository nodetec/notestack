import { FollowingContext } from "@/app/context/following-provider";
import { ProfilesContext } from "@/app/context/profiles-provider";
import { RelayContext } from "@/app/context/relay-provider";
import { NostrService } from "@/app/lib/nostr";
import Link from "next/link";
import { Event, nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Contact from "./Contact";

export default function Following({ npub }: any) {
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { following, setFollowing } = useContext(FollowingContext);

  // @ts-ignore
  const { setpubkeys } = useContext(ProfilesContext);

  const [followingEvents, setFollowingEvents] = useState<Event[]>();

  useEffect(() => {
    let pubkeysSet = new Set<string>();

    if (activeRelay) {
      setFollowingEvents([]);
      const profilePubkey = nip19.decode(npub).data.toString();
      // console.log("ACTIVERELAY", activeRelay);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let followingKey = `following_${relayUrl}_${profilePubkey}`;

      if (following[followingKey]) {
        // console.log("Cached events from context");
        setFollowingEvents(following[followingKey]);
      } else {
        console.log("Getting events from relay");
        let sub = activeRelay.sub([
          {
            kinds: [3],
            authors: [profilePubkey],
            limit: 5,
          },
        ]);

        let events: Event[] = [];

        sub.on("event", (event: Event) => {
          console.log("getting event", event, "from relay:", activeRelay.url);
          // @ts-ignore
          event.relayUrl = relayUrl;
          events.push(event);
          pubkeysSet.add(event.pubkey);
        });

        sub.on("eose", () => {
          // console.log("PUBKEYS ARE:", pubkeysSet);
          // console.log("EOSE initial latest events from", activeRelay.url);
          const filteredEvents = NostrService.filterEvents(events);

          let followingKey = `following_${relayUrl}_${profilePubkey}`;
          following[followingKey] = filteredEvents;
          setFollowing(following);

          // console.log("FILTERED____EVENTS", filteredEvents);

          if (filteredEvents.length > 0) {
            const contacts = filteredEvents[0].tags;

            const contactPublicKeys = contacts.map((contact: any) => {
              return contact[1];
            });
            setFollowingEvents(contactPublicKeys);
          } else {
            setFollowingEvents([]);
          }
          if (pubkeysSet.size > 0) {
            setpubkeys(Array.from(pubkeysSet));
          }
          sub.unsub();
        });
      }
    }
  }, [activeRelay]);

  // TODO: add caching
  // useEffect(() => {
  //   if (!activeRelay) return;

  //   let eventArray: Event[] = [];

  //   let sub = activeRelay.sub([
  //     {
  //       kinds: [0],
  //       authors: contactPublicKeys,
  //       limit: 5,
  //     },
  //   ]);

  //   sub.on("event", (event: Event) => {
  //     eventArray.push(event);
  //   });

  //   sub.on("eose", () => {
  //     // console.log("EOSE additional events from", activeRelay.url);
  //     const filteredEvents = NostrService.filterEvents(eventArray);
  //     if (filteredEvents.length > 0) {
  //       setEvents(filteredEvents);
  //     } else {
  //       setEvents([]);
  //     }
  //     sub.unsub();
  //   });
  // }, [activeRelay]);

  // let uniqueContacts = contacts.filter(
  //   (obj, index, self) =>
  //     index === self.findIndex((t) => t.pubkey === obj.pubkey)
  // );
  // const followingsCount = userContacts.length;

  return (
    <div className="flex flex-col gap-4 pt-10">
      <h4 className="text-sm font-bold">Following</h4>
      <ul className="flex flex-col gap-2">
        {followingEvents &&
          followingEvents.slice(0, 5).map((contact: any) => (
            <Contact
              key={contact.id}
              // followingsCount={followingsCount}
              contact={contact}
            />
          ))}
      </ul>
      {/* <Link */}
      {/*   href={`/${npub}/following`} */}
      {/*   className="text-gray hover:text-gray-hover text-xs" */}
      {/* > */}
      {/*   See all ({followingsCount}) */}
      {/* </Link> */}
    </div>
  );
}
