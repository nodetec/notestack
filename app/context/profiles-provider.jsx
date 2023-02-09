"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RelayContext } from "./relay-provider";
import { NostrService } from "../lib/nostr";

export const ProfilesContext = createContext([]);

export default function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState({});
  const [reload, setReload] = useState(false);
  // @ts-ignore
  const { activeRelay, relayUrl } = useContext(RelayContext);

  const addProfiles = async (pubkeys) => {
    if (!relayUrl) return;

    const relay = await NostrService.connect(relayUrl, activeRelay);
    if (!relay) return;

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
      event.relayUrl = relayName;
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
