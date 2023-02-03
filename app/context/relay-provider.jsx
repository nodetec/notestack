"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import { uniqBy } from "../lib/utils";

export const RelayContext = createContext({});

export default function RelayProvider({ children }) {
  const [allRelays, setAllRelays] = useState(RELAYS);
  const [activeRelays, setActiveRelays] = useState([RELAYS[0]]);
  const [closedRelays, setClosedRelays] = useState([]);
  const [connectedRelays, setConnectedRelays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("ACTIVE RELAYS ARE:", activeRelays);
    activeRelays.forEach(async (relayUrl) => {
      const relay = relayInit(relayUrl);
      relay.connect();

      relay.on("connect", () => {
        console.log("info", `✅ nostr (${relayUrl}): Connected!`);
        setIsLoading(false);
        setConnectedRelays((prev) => uniqBy([...prev, relay], "url"));
      });

      relay.on("disconnect", () => {
        console.log("warn", `🚪 nostr (${relayUrl}): Connection closed.`);
        setConnectedRelays((prev) => prev.filter((r) => r.url !== relayUrl));
        setActiveRelays((prev) => prev.filter((r) => r !== relayUrl));
      });

      relay.on("error", () => {
        console.log("error", `❌ nostr (${relayUrl}): Connection error!`);
      });
    });
  }, [activeRelays]);

  useEffect(() => {
    console.log("CONNECTED RELAYS ARE:", connectedRelays);
  }, [connectedRelays]);

  useEffect(() => {
    console.log("CLOSED RELAYS ARE:", closedRelays);
    // closedRelays.forEach(async (relayUrl) => {
    //   const relay = relayInit(relayUrl);
    //   relay.close();
    // });

    let prunedConnectedRelays = connectedRelays.filter(
      (connectedRelay) => {
        return closedRelays.includes(connectedRelay);
      }
    );

    setConnectedRelays(prunedConnectedRelays);
  }, [closedRelays]);

  return (
    <RelayContext.Provider
      value={{
        allRelays,
        setAllRelays,
        activeRelays,
        setActiveRelays,
        closedRelays,
        setClosedRelays,
        connectedRelays,
        setConnectedRelays,
        isLoading,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}
