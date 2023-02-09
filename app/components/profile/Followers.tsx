import { useContext, useEffect, useState } from "react";
import { Event, nip19 } from "nostr-tools";
import { RelayContext } from "@/app/context/relay-provider";
import { FollowersContext } from "@/app/context/followers-provider";
import { NostrService } from "@/app/lib/nostr";

export default function Followers({ npub }: any) {
  // @ts-ignore
  const { relayUrl, activeRelay, connect } = useContext(RelayContext);

  // @ts-ignore
  const { followers, setFollowers } = useContext(FollowersContext);

  const [localFollowers, setLocalFollowers] = useState<Event[]>([]);

  const getFollowers = async () => {
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

    const relay = await connect(relayUrl, activeRelay);
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
    });

    sub.on("eose", () => {
      // console.log("EOSE additional events from", activeRelay.url);
      const filteredEvents = NostrService.filterEvents(eventArray);
      if (filteredEvents.length > 0) {
        setLocalFollowers(filteredEvents);
        followers[followerKey] = filteredEvents;
        setFollowers(followers);
      } else {
        setLocalFollowers([]);
      }
      sub.unsub();
    });
  };

  useEffect(() => {
    getFollowers();

  }, [relayUrl, activeRelay]);

  return (
    <div
      // className="text-base text-gray hover:text-gray-hover my-2"
      className="text-base text-gray my-2"
      // href={`/u/${npub}`}
    >
      {localFollowers && localFollowers.length > 9
        ? " 10+"
        : " " + localFollowers.length}
      Followers
    </div>
  );
}
