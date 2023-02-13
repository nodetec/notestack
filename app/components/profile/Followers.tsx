import { useContext, useEffect, useState } from "react";
import { Event, nip19 } from "nostr-tools";
import { RelayContext } from "@/app/context/relay-provider";
import { FollowersContext } from "@/app/context/followers-provider";
import { NostrService } from "@/app/lib/nostr";
import FollowingPopup from "./FollowingPopup";
import { ProfilesContext } from "@/app/context/profiles-provider";

export default function Followers({ npub }: any) {
  const { relayUrl, activeRelay, connect } = useContext(RelayContext);

  // @ts-ignore
  const { followers, setFollowers } = useContext(FollowersContext);

  // @ts-ignore
  const { addProfiles } = useContext(ProfilesContext);

  const [localFollowers, setLocalFollowers] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [followerPubkeys, setFollowerPubkeys] = useState<string[]>();

  const getFollowers = async () => {
    let pubkeysSet = new Set<string>();
    setLocalFollowers([]);
    const profilePubkey = nip19.decode(npub).data.toString();
    let cachedFollowers;
    let relayName = relayUrl.replace("wss://", "");
    const followerKey = `followers_${relayName}_${profilePubkey}`;

    if (followers) {
      cachedFollowers = followers[followerKey];
    }

    if (cachedFollowers) {
      setLocalFollowers(cachedFollowers);
      return;
    }

    const relay = await connect(relayUrl);
    if (!relay) return;
    let sub = relay.sub([
      {
        kinds: [3],
        "#p": [profilePubkey],
        limit: 10,
      },
    ]);

    let eventArray: Event[] = [];

    sub.on("event", (event: Event) => {
      eventArray.push(event);
      pubkeysSet.add(event.pubkey);
    });

    sub.on("eose", () => {
      if (eventArray.length === 0) {
        sub.unsub();
        return;
      }

      const contactPublicKeys = Array.from(pubkeysSet);

      followers[followerKey] = contactPublicKeys;
      setFollowers(followers);
      setFollowerPubkeys(contactPublicKeys);
      addProfiles(contactPublicKeys.slice(0, 5));

      sub.unsub();
    });
  };

  useEffect(() => {
    getFollowers();
  }, [relayUrl, activeRelay]);

  return (
    <>
      <div
        // className="cursor-pointer text-base text-gray hover:text-gray-hover my-2"
        // onClick={() => setIsOpen(true)}
        className="text-base text-gray my-2"
      >
        {followerPubkeys && followerPubkeys.length}
        {followerPubkeys && followerPubkeys.length >= 10 && "+"}
        {" "}
        Followers
      </div>
      <FollowingPopup
        pubkeys={followerPubkeys}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </>
  );
}
