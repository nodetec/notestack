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
  const { relayUrl, activeRelay, connect } = useContext(RelayContext);

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

    if (following[followingKey]) {
      // console.log("Cached events from context");
      setFollowingPubkeys(following[followingKey].slice(0, 5));
    } else {
      // console.log("Getting events from relay");

      const relay = await connect(relayUrl, activeRelay);
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
        event.relayUrl = relayName;
        events.push(event);
        pubkeysSet.add(event.pubkey);
      });

      sub.on("eose", () => {
        // const filteredEvents = NostrService.filterEvents(events);
        // console.log("filtered events", filteredEvents);

        // console.log("FOLLOWING:", following);
        // console.log("FILTERED EVENTS:", events);

        if (events.length === 0) {
          sub.unsub();
          return;
        }

        const contacts = events[0].tags.slice(0, 5);
        console.log("CONTACTS:", contacts);
        const contactPublicKeys = contacts.map((contact: any) => {
          return contact[1];
        });
        let followingKey = `following_${relayName}_${profilePubkey}`;
        following[followingKey] = contactPublicKeys;

        setFollowing(contactPublicKeys);
        setFollowingPubkeys(following[followingKey]);
        addProfiles(contactPublicKeys);

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
          followingPubkeys.length > 0 &&
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
