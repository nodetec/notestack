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
  const { relayUrl, activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { following, setFollowing } = useContext(FollowingContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  const [followingPubkeys, setFollowingPubkeys] = useState<string[]>();

  const getFollowingEvents = async () => {
    let pubkeysSet = new Set<string>();

    setFollowingPubkeys([]);
    const profilePubkey = nip19.decode(npub).data.toString();
    let relayName = relayUrl.replace("wss://", "");
    let followingKey = `following_${relayName}_${profilePubkey}`;

    if (following[followingKey] && following[followingKey].length >= 5) {
      // console.log("Cached events from context");
      setFollowingPubkeys(following[followingKey].slice(5));
    } else {
      // console.log("Getting events from relay");

      const relay = await NostrService.connect(relayUrl, activeRelay);
      if (!relay) return;
      let sub = relay.sub([
        {
          kinds: [3],
          authors: [profilePubkey],
        },
      ]);

      let events: Event[] = [];

      sub.on("event", (event: Event) => {
        // console.log("getting event", event, "from relay:", activeRelay.url);
        console.log("following event", event);
        // @ts-ignore
        event.relayUrl = relayUrl;
        events.push(event);
        pubkeysSet.add(event.pubkey);
      });

      sub.on("eose", () => {
        const filteredEvents = NostrService.filterEvents(events);
        // console.log("filtered events", filteredEvents);

        let followingKey = `following_${relayName}_${profilePubkey}`;
        following[followingKey] = filteredEvents;
        console.log("FOLLOWING:", following);
        console.log("FILTERED EVENTS:", filteredEvents);

        if (filteredEvents.length === 0) {
          sub.unsub();
          return;
        }
        const contacts = filteredEvents[0].tags.slice(5);
        const contactPublicKeys = contacts.map((contact: any) => {
          return contact[1];
        });

        setFollowing(contactPublicKeys.slice(5));
        setFollowingPubkeys(contactPublicKeys.slice(5));
        addProfiles(contactPublicKeys.slice(5));

        sub.unsub();
      });
    }
  };

  useEffect(() => {
    getFollowingEvents();
  }, [relayUrl]);

  return (
    <div className="flex flex-col gap-4 pt-10">
      <h4 className="text-sm font-bold">Following</h4>
      <ul className="flex flex-col gap-2">
        {followingPubkeys &&
          followingPubkeys.slice(0, 5).map((pubkey: any) => (
            <Contact
              key={pubkey}
              // followingsCount={followingsCount}
              pubkey={pubkey}
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
