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
  const { setpubkeys, profiles, setProfiles } = useContext(ProfilesContext);

  const [followingEvents, setFollowingEvents] = useState<Event[]>();

  useEffect(() => {
    let pubkeysSet = new Set<string>();

    if (activeRelay) {
      setFollowingEvents([]);
      const profilePubkey = nip19.decode(npub).data.toString();
      // console.log("ACTIVERELAY", activeRelay);
      let relayUrl = activeRelay.url.replace("wss://", "");
      let followingKey = `following_${relayUrl}_${profilePubkey}`;

      if (following[followingKey] && following[followingKey].length >= 5) {
        // console.log("Cached events from context");
        setFollowingEvents(following[followingKey].slice(5));
      } else {
        console.log("Getting events from relay");
        let sub = activeRelay.sub([
          {
            kinds: [3],
            authors: [profilePubkey],
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

            // console.log("CONTACT PUBLIC KEYS:", contactPublicKeys);

            getProfiles(contactPublicKeys);

            // console.log("FOLLOWING PROFILES:", followingProfiles);

            // setFollowingEvents(followingProfiles);
          }
          sub.unsub();
        });
      }
    }
  }, [activeRelay]);

  const getProfiles = (publicKeys: string[]) => {
    let relayUrl = activeRelay.url.replace("wss://", "");

    const cachedProfiles: Event[] = [];
    const profilesToLookup: string[] = [];

    publicKeys.forEach((pubkey) => {
      const cachedProfile = profiles[`profile_${relayUrl}_${pubkey}`];
      if (cachedProfile) {
        cachedProfiles.push(cachedProfile);
      } else {
        profilesToLookup.push(pubkey);
      }
    });

    if (profilesToLookup.length === 0) {
      setFollowingEvents(cachedProfiles);
    }

    console.log("CACHED PROFILES:", cachedProfiles);
    console.log("PROFILES TO LOOKUP:", profilesToLookup);

    // check if any are already in context cache if they are add them to list
    // if there are any left look them up
    // add them to list

    if (profilesToLookup.length > 0) {
      let sub = activeRelay.sub([
        {
          kinds: [0],
          authors: profilesToLookup,
          limit: 5,
        },
      ]);
      let events: Event[] = [];
      sub.on("event", (event: Event) => {
        // @ts-ignore
        events.push(event);
      });
      sub.on("eose", () => {
        if (events.length !== 0) {
          let newProfiles: Event[] = [];
          events.forEach((event) => {
            newProfiles.push(event);
            profiles[`profile_${relayUrl}_${event.pubkey}`];
          });

          console.log("LOOKED UP PROFILES DAWG:", newProfiles);

          setFollowingEvents([...newProfiles, ...cachedProfiles]);
          setProfiles(profiles);
        }
        sub.unsub();
      });
    }
  };

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
