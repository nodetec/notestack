import { FollowingContext } from "@/app/context/following-provider";
import { ProfilesContext } from "@/app/context/profiles-provider";
import { RelayContext } from "@/app/context/relay-provider";
import Link from "next/link";
import { Event, nip19 } from "nostr-tools";
import { useContext, useEffect, useState } from "react";
import Contact from "./Contact";
import FollowingPopup from "./FollowingPopup";

export default function Following({ npub }: any) {
  // @ts-ignore
  const { relayUrl, activeRelay, connect } = useContext(RelayContext);

  // @ts-ignore
  const { following, setFollowing } = useContext(FollowingContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  const [followingPubkeys, setFollowingPubkeys] = useState<string[]>();

  const [followingCount, setFollowingCount] = useState<number>();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getFollowingEvents = async () => {
    let pubkeysSet = new Set<string>();

    setFollowingPubkeys([]);
    const profilePubkey = nip19.decode(npub).data.toString();
    let relayName = relayUrl.replace("wss://", "");
    let followingKey = `following_${relayName}_${profilePubkey}`;

    if (following[followingKey]) {
      setFollowingPubkeys(following[followingKey]);
      addProfiles(following[followingKey]);
      const size = following[followingKey].length;
      setFollowingCount(size);
      return;
    }

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
      // @ts-ignore
      event.relayUrl = relayName;
      events.push(event);
      pubkeysSet.add(event.pubkey);
    });

    sub.on("eose", () => {
      if (events.length === 0) {
        sub.unsub();
        return;
      }

      const contacts = events[0].tags;
      const size = contacts.length;
      const contactPublicKeys = contacts.map((contact: any) => {
        return contact[1];
      });

      following[followingKey] = contactPublicKeys;

      setFollowing(following);
      setFollowingPubkeys(contactPublicKeys);
      setFollowingCount(size);
      addProfiles(contactPublicKeys.slice(0, 5));

      sub.unsub();
    });
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
          followingPubkeys
            .slice(0, 5)
            .map((pubkey: any) => <Contact key={pubkey} pubkey={pubkey} />)}
      </ul>
      {followingCount && (
        <>
          <div
            className="cursor-pointer text-gray hover:text-gray-hover text-xs"
            onClick={() => setIsOpen(true)}
          >
            See all ({followingCount})
          </div>
          <FollowingPopup
            pubkeys={followingPubkeys}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
        </>
      )}
    </div>
  );
}
