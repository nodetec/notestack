"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import { uniqBy } from "../lib/utils";

export const RelayContext = createContext({});

export default function RelayProvider({ children }) {
  const [allRelays, setAllRelays] = useState(RELAYS);
  const [activeRelays, setActiveRelays] = useState([RELAYS[0]]);
  const [inactiveRelays, setInactiveRelays] = useState(RELAYS.slice(1));
  const [connectedRelays, setConnectedRelays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("ACTIVE RELAYS ARE:", activeRelays);
    activeRelays.forEach(async (relayUrl) => {
      const relay = relayInit(relayUrl);
      relay.connect();
      if (inactiveRelays.includes(relay.url)) {
        // relay.close();
        setInactiveRelays(...inactiveRelays, relay.url);
      }

      // if (!inactiveRelays.includes(relay.url)) {
      relay.on("connect", () => {
        console.log("info", `✅ nostr (${relayUrl}): Connected!`);
        setIsLoading(false);
        setConnectedRelays((prev) => uniqBy([...prev, relay], "url"));
        // activeRelays.forEach(activeRelay => {

        // })
      });

      relay.on("disconnect", () => {
        console.log("warn", `🚪 nostr (${relayUrl}): Connection closed.`);
        setConnectedRelays((prev) => prev.filter((r) => r.url !== relayUrl));
        setActiveRelays((prev) => prev.filter((r) => r !== relayUrl));
        setInactiveRelays([...inactiveRelays, relayUrl]);
        setIsReady(false);
      });

      relay.on("error", () => {
        console.log("error", `❌ nostr (${relayUrl}): Connection error!`);
      });
      // }
    });
  }, [activeRelays]);

  useEffect(() => {
    if (
      connectedRelays.length === activeRelays.length &&
      connectedRelays.length !== 0
    ) {
      console.log("WE'RE READY TO GO");
      console.log("CONNECTED RELAYS ARE:", connectedRelays);
      console.log("ACTIVE RELAYS ARE:", activeRelays);
      setIsReady(true);
    }
  }, [connectedRelays, activeRelays]);

  useEffect(() => {
    console.log("INACTIVE RELAYS ARE:", inactiveRelays);
    let prunedConnectedRelays = connectedRelays.filter((connectedRelay) => {
      return inactiveRelays.includes(connectedRelay);
    });
    setConnectedRelays(prunedConnectedRelays);
  }, [inactiveRelays]);

  return (
    <RelayContext.Provider
      value={{
        allRelays,
        setAllRelays,
        activeRelays,
        setActiveRelays,
        inactiveRelays,
        setInactiveRelays,
        connectedRelays,
        setConnectedRelays,
        isLoading,
        isReady,
        setIsReady,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}
