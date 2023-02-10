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

  const publishToRelays = async (relays, event, onOk, onSeen, onFailed) => {
    console.log("publishing to relays:", relays);
    for (const url of relays) {
      const relay = relayInit(url);
      await relay.connect();

      relay.on("connect", () => {
        console.log(`connected to ${relay.url}`);
      });
      relay.on("error", () => {
        console.log(`failed to connect to ${relay.url}`);
      });
      //publish event
      let pub = relay.publish(event);
      pub.on("ok", () => {
        console.log(`${relay.url} has accepted our event`);
        onOk();
      });
      pub.on("seen", () => {
        console.log(`we saw the event on ${relay.url}`);
        onSeen();
        relay.close();
      });
      pub.on("failed", (reason) => {
        console.log(`failed to publish to ${relay.url}: ${reason}`);
        onFailed();
        relay.close();
      });
    }
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
        publishToRelays,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
}
