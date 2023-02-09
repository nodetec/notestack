"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import { NotifyContext } from "./notify-provider";

export const RelayContext = createContext({});

export default function RelayProvider({ children }) {
  const { setNotifyMessage } = useContext(NotifyContext);
  const [allRelays, setAllRelays] = useState(RELAYS);
  const [relayUrl, setRelayUrl] = useState(RELAYS[0]);
  const [activeRelay, setActiveRelay] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!relayUrl) return;
    const relay = relayInit(relayUrl);
    setIsLoading(true);

    relay.connect();

    relay.on("connect", () => {
      console.log("info", `✅ nostr (${relayUrl}): Connected!`);
      setIsLoading(false);
      if (relayUrl === relay.url) {
        console.log("NEW ACTIVE RELAY IS:", activeRelay);
        setActiveRelay(relay);
      }
    });

    relay.on("disconnect", () => {
      console.log("warn", `🚪 nostr (${relayUrl}): Connection closed.`);
    });

    relay.on("error", () => {
      console.log("error", `❌ nostr (${relayUrl}): Connection error!`);
      setNotifyMessage(`Unable to connect to ${relayUrl}`);
    });
  }, [relayUrl]);

  const connect = async (newRelayUrl, oldActiveRelay) => {
    if (oldActiveRelay && oldActiveRelay.url === newRelayUrl) {
      return oldActiveRelay;
    }

    if (!newRelayUrl) return;
    const relay = relayInit(newRelayUrl);

    await relay.connect();

    relay.on("connect", () => {
      console.log("info", `✅ nostr (${newRelayUrl}): Connected!`);
      if (relayUrl === relay.url) {
        console.log("NEW ACTIVE RELAY IS:", activeRelay);
        setActiveRelay(relay);
      }
    });

    relay.on("disconnect", () => {
      console.log("warn", `🚪 nostr (${newRelayUrl}): Connection closed.`);
    });

    relay.on("error", () => {
      console.log("error", `❌ nostr (${newRelayUrl}): Connection error!`);
      setNotifyMessage(`Unable to connect to ${relayUrl}`);
    });

    return relay;
  };

  return (
    <RelayContext.Provider
      value={{
        allRelays,
        setAllRelays,
        activeRelay,
        setActiveRelay,
        isLoading,
        isReady,
        setIsReady,
        relayUrl,
        setRelayUrl,
        connect,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}
