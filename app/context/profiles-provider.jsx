"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RelayContext } from "./relay-provider";

export const ProfilesContext = createContext([]);

export default function ProfilesProvider({ children }) {
  const [profiles, setProfiles] = useState({});
  const [reload, setReload] = useState(false);
  const { relayUrl, subscribe } = useContext(RelayContext);

  const addProfiles = async (pubkeys) => {
    if (!relayUrl) return;

    let relayName = relayUrl.replace("wss://", "");

    const filter = {
      kinds: [0],
      authors: pubkeys,
    };

    let events = [];

    const onEvent = (event) => {
      events.push(event);
    };

    const onEOSE = () => {
      if (events.length !== 0) {
        events.forEach((event) => {
          let profileKey = `profile_${relayName}_${event.pubkey}`;
          profiles[profileKey] = event;
          const newProfiles = profiles;
          setProfiles(newProfiles);
          setReload(!reload);
        });
      }
    };

    subscribe([relayUrl], filter, onEvent, onEOSE);
  };

  return (
    <ProfilesContext.Provider
      value={{ addProfiles, profiles, setProfiles, reload, setReload }}
    >
      {children}
    </ProfilesContext.Provider>
  );
}
