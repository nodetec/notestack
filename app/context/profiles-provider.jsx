"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RelayContext } from "./relay-provider";
import { NostrService } from "../lib/nostr";

export const ProfilesContext = createContext([]);

export default function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState({});
  const [allPubkeys, setAllPubkeys] = useState([]);
  const [reload, setReload] = useState(false);
  // @ts-ignore
  const { activeRelay, relayUrl } = useContext(RelayContext);

  const addProfiles = async (pubkeys) => {
    if (!relayUrl) return;

    const relay = await NostrService.connect(relayUrl, activeRelay);
    if (!relay) return;

    // console.log("Looking up profiles:", pubkeys);
    // console.log("allPubkeys:", allPubkeys);


    // const filteredEvents = eventArray.filter((e1: Event, index: number) => {
    //   if (e1.content === "") {
    //     return false;
    //   }
    //   return eventArray.findIndex((e2: Event) => e2.id === e1.id) === index;
    // });

    // const unseenPubkeys = pubkeys.filter((pubkey) => {
    //   if (allPubkeys.includes(pubkey)) {
    //     return false;
    //   } else {
    //     return true;
    //   }

    // })
    // let pubkeysSet = new Set([...allPubkeys, ...pubkeys]);


    // setAllPubkeys(Array.from(pubkeysSet));

    // if (unseenPubkeys.length === 0) {
    //   setReload(!reload);
    // }

    // console.log("filtered pubkeys:", unseenPubkeys);

    let relayName = relayUrl.replace("wss://", "");
    let sub = relay.sub([
      {
        kinds: [0],
        authors: pubkeys,
      },
    ]);
    let events = [];
    sub.on("event", (event) => {
      // console.log("Looking up profile EVENT:", event.pubkey);
      // @ts-ignore
      events.push(event);
    });
    sub.on("eose", () => {
      sub.unsub();
      if (events.length !== 0) {
        events.forEach((event) => {
          let profileKey = `profile_${relayName}_${event.pubkey}`;
          profiles[profileKey] = event;
          const newProfiles = profiles;
          setProfiles(newProfiles);
          setReload(!reload);
        });
      }
      // console.log("profiles:", profiles);
      // console.log("DONE Looking up profiles EVENT:", events);
    });
  };

  return (
    <ProfilesContext.Provider
      value={{ addProfiles, profiles, setProfiles, reload, setReload }}
    >
      {children}
    </ProfilesContext.Provider>
  );
}
