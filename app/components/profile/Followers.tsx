import { useContext, useEffect, useState } from "react";
import { Event, nip19 } from "nostr-tools";
import { RelayContext } from "@/app/context/relay-provider";
import { FollowersContext } from "@/app/context/followers-provider";
import { NostrService } from "@/app/lib/nostr";

export default function Followers({ npub }: any) {
  // @ts-ignore
  const { activeRelay } = useContext(RelayContext);

  // @ts-ignore
  const { followers, setFollowers } = useContext(FollowersContext);

  const [localFollowers, setLocalFollowers] = useState<Event[]>([]);

  useEffect(() => {
    if (!activeRelay) return;
    setLocalFollowers([]);
    const profilePubkey = nip19.decode(npub).data.toString();
    let relayUrl = activeRelay.url.replace("wss://", "");
    let cachedFollowers;

    if (followers) {
      cachedFollowers = followers[`followers_${relayUrl}_${profilePubkey}`];
    }

    if (cachedFollowers) {
      // console.log("GETTING FOLLOWERS FROM CACHE:", cachedFollowers);
      setLocalFollowers(cachedFollowers);
    } else {
      // console.log("GETTING FOLLOWERS FROM RELAY:");
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
        // console.log("EOSE additional events from", activeRelay.url);
        const filteredEvents = NostrService.filterEvents(eventArray);
        if (filteredEvents.length > 0) {
          setLocalFollowers(filteredEvents);
          followers[`followers_${relayUrl}_${profilePubkey}`] = filteredEvents;
          setFollowers(followers);
        } else {
          setLocalFollowers([]);
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
      {localFollowers && localFollowers.length > 100
        ? "100+"
        : localFollowers.length}{" "}
      Followers
    </div>
  );
}
