"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { RELAYS } from "../lib/constants";
import { relayInit } from "nostr-tools";
import type { Relay, Event } from "nostr-tools";
import { NotifyContext } from "./notify-provider";

interface IRelayContext {
  allRelays: string[];
  setAllRelays: React.Dispatch<React.SetStateAction<string[]>>;
  activeRelay: Relay | undefined;
  setActiveRelay: React.Dispatch<React.SetStateAction<any>>;
  relayUrl: string;
  setRelayUrl: React.Dispatch<React.SetStateAction<string>>;
  connect: (newRelayUrl: string) => Promise<any>;
  connectedRelays: Set<Relay>;
  setConnectedRelays: React.Dispatch<React.SetStateAction<Set<Relay>>>;
  publish: (
    relays: string[],
    event: any,
    onOk: () => void,
    onSeen: () => void,
    onFailed: () => void
  ) => void;
  subToRelay: (
    url: string,
    filter: any,
    onEvent: (event: any) => void,
    onEOSE: () => void
  ) => void;
}

export const RelayContext = createContext<IRelayContext>({
  allRelays: [],
  setAllRelays: () => {},
  activeRelay: undefined,
  setActiveRelay: () => {},
  relayUrl: "",
  setRelayUrl: () => {},
  connect: () => Promise.resolve(),
  connectedRelays: new Set<Relay>(),
  setConnectedRelays: () => {},
  publish: () => {},
  subToRelay: () => {},
});

const RelayProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setNotifyMessage } = useContext(NotifyContext);
  const [allRelays, setAllRelays] = useState<string[]>(RELAYS);
  const [relayUrl, setRelayUrl] = useState<string>(RELAYS[0]);
  const [activeRelay, setActiveRelay] = useState<Relay>();
  const [connectedRelays, setConnectedRelays] = useState<Set<Relay>>(new Set());

  useEffect(() => {
    connect(relayUrl);
  }, [relayUrl]);

  useEffect(() => {
    console.log("NEW ACTIVE RELAY IS:", activeRelay);
  }, [activeRelay]);

  useEffect(() => {
    console.log("CONNECTED RELAYS URE:", connectedRelays);
  }, [connectedRelays]);

  const connect = async (newRelayUrl: string) => {
    console.log("connecting to relay:", newRelayUrl);
    if (!newRelayUrl) return;

    let relay: Relay;
    let existingRelay: Relay | undefined;
    if (connectedRelays.size > 0) {
      existingRelay = Array.from(connectedRelays).find(
        (r) => r.url === newRelayUrl
      );
    }

    if (existingRelay) {
      console.log("info", `✅ nostr (${newRelayUrl}): Already connected!`);
      relay = existingRelay;
      setActiveRelay(relay);
    } else {
      console.log("NEWING UP A RELAY");
      relay = relayInit(newRelayUrl);

      await relay.connect();

      relay.on("connect", () => {
        console.log("info", `✅ nostr (${newRelayUrl}): Connected!`);
        if (relayUrl === relay.url) {
          setActiveRelay(relay);
          const isRelayInSet = Array.from(connectedRelays).some(
            (r) => r.url === relay.url
          );

          if (!isRelayInSet) {
            setConnectedRelays(new Set([...connectedRelays, relay]));
          }
        }
      });

      relay.on("disconnect", () => {
        console.log("warn", `🚪 nostr (${newRelayUrl}): Connection closed.`);
        setConnectedRelays(
          new Set([...connectedRelays].filter((r) => r.url !== relay.url))
        );
      });

      relay.on("error", () => {
        console.log("error", `❌ nostr (${newRelayUrl}): Connection error!`);
        setNotifyMessage(`Unable to connect to ${relayUrl}`);
      });
    }

    return relay;
  };

  const publish = async (
    relays: string[],
    event: any,
    onOk: () => void,
    onSeen: () => void,
    onFailed: () => void
  ) => {
    console.log("publishing to relays:", relays);
    for (const url of relays) {
      const relay = await connect(url);

      if (!relay) return;

      let pub = relay.publish(event);
      pub.on("ok", () => {
        console.log(`${url} has accepted our event`);
        onOk();
      });
      pub.on("seen", () => {
        console.log(`we saw the event on ${url}`);
        onSeen();
        // relay.close();
      });
      pub.on("failed", (reason: any) => {
        console.log(`failed to publish to ${url}: ${reason}`);
        onFailed();
        // relay.close();
      });
    }
  };

  const subToRelay = async (
    url: string,
    filter: any,
    onEvent: (event: any) => void,
    onEOSE: () => void
  ) => {
    const relay = relayInit(url);
    await relay.connect();

    relay.on("connect", () => {
      console.log(`connected to ${relay.url}`);
    });

    relay.on("error", () => {
      console.log(`failed to connect to ${relay.url}`);
    });

    let sub = relay.sub([filter]);

    sub.on("event", (event: any) => {
      // console.log("we got the event we wanted:", event);
      onEvent(event);
    });

    sub.on("eose", () => {
      // console.log("we've reached the end");
      onEOSE();
      sub.unsub();
      relay.close();
    });
  };

  return (
    <RelayContext.Provider
      value={{
        allRelays,
        setAllRelays,
        activeRelay,
        setActiveRelay,
        relayUrl,
        setRelayUrl,
        connect,
        connectedRelays,
        setConnectedRelays,
        publish,
        subToRelay,
      }}
    >
      {children}
    </RelayContext.Provider>
  );
};

export default RelayProvider;
