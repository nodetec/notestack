"use client";

import { createContext, useState, useCallback, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import { uniqBy } from "../lib/utils";

export const RelayContext = createContext({});

export default function RelayProvider({ children }) {
  const [allRelays, setAllRelays] = useState(RELAYS);
  const [pendingActiveRelayUrl, setPendingActiveRelayUrl] = useState(RELAYS[0]);
  const [activeRelay, setActiveRelay] = useState();
  const [connectedRelays, setConnectedRelays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log("PENDING ACTIVE RELAY IS:", pendingActiveRelayUrl);
    console.log("ACTIVE RELAY IS:", activeRelay);
    if (pendingActiveRelayUrl !== "") {
      const relay = relayInit(pendingActiveRelayUrl);

      // if (pendingActiveRelayUrl === relay.url) {
        relay.connect();
      // }

      relay.on("connect", () => {
        console.log("info", `✅ nostr (${pendingActiveRelayUrl}): Connected!`);
        setIsLoading(false);
        setConnectedRelays((prev) => uniqBy([...prev, relay], "url"));
        if (pendingActiveRelayUrl === relay.url) {
          console.log("NEW ACTIVE RELAY IS:", activeRelay);
          setActiveRelay(relay);
        }
        // setIsReady(true);
        // setPendingActiveRelayUrl("");
      });

      relay.on("disconnect", () => {
        console.log(
          "warn",
          `🚪 nostr (${pendingActiveRelayUrl}): Connection closed.`
        );
        setConnectedRelays((prev) =>
          prev.filter((r) => r.url !== pendingActiveRelayUrl)
        );
        // if (activeRelay === relay.url) {
        //   setActiveRelay("");
        // }
      });

      relay.on("error", () => {
        console.log(
          "error",
          `❌ nostr (${pendingActiveRelayUrl}): Connection error!`
        );
      });
    }
  }, [pendingActiveRelayUrl]);

  return (
    <RelayContext.Provider
      value={{
        allRelays,
        setAllRelays,
        activeRelay,
        setActiveRelay,
        connectedRelays,
        setConnectedRelays,
        isLoading,
        isReady,
        setIsReady,
        pendingActiveRelayUrl,
        setPendingActiveRelayUrl,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}
