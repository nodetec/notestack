"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import { uniqBy } from "../lib/utils";
import { NotifyContext } from "./notify-provider";

export const RelayContext = createContext({});

export default function RelayProvider({ children }) {
  const { setNotifyMessage } = useContext(NotifyContext);
  const [allRelays, setAllRelays] = useState(RELAYS);
  const [pendingActiveRelayUrl, setPendingActiveRelayUrl] = useState(RELAYS[0]);
  const [activeRelay, setActiveRelay] = useState();
  const [activeUrl, setActiveRelayUrl] = useState();
  const [connectedRelays, setConnectedRelays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  // TODO: need active relay URL for getting stuff, don't have to wait for it to connect

  useEffect(() => {
    if (pendingActiveRelayUrl !== "") {
      const relay = relayInit(pendingActiveRelayUrl);
      setIsLoading(true)

      // if (pendingActiveRelayUrl === relay.url) {
        relay.connect();
      // }

      relay.on("connect", () => {
        console.log("info", `✅ nostr (${pendingActiveRelayUrl}): Connected!`);
        setIsLoading(false);
        setConnectedRelays((prev) => uniqBy([...prev, relay], "url"));
        if (pendingActiveRelayUrl === relay.url) {
          console.log("NEW ACTIVE RELAY IS:", activeRelay);
          const newRelay = relay
          setActiveRelay(newRelay);
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
        setNotifyMessage(`Unable to connect to ${pendingActiveRelayUrl}`);
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
