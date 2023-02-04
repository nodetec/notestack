"use client";
import { RelayContext } from "./context/relay-provider.jsx";
import { useContext, useEffect, useState } from "react";
import { Relay } from "nostr-tools/relay.js";

export default function FollowedRelays() {
  const {
    // @ts-ignore
    connectedRelays,
    // @ts-ignore
    activeRelays,
    // @ts-ignore
    setActiveRelays,
    // @ts-ignore
    allRelays,
    // @ts-ignore
    inactiveRelays,
    // @ts-ignore
    setInactiveRelays,
    // @ts-ignore
    setIsReady,
  } = useContext(RelayContext);
  const [relayNames, setRelayNames] = useState<string[]>([]);

  useEffect(() => {
    const mappedRelayNames = allRelays.map((relay: string) =>
      relay.replace("wss://", "")
    );
    // setRelayNames(["all", ...mappedRelayNames]);
    setRelayNames(mappedRelayNames);
  }, [activeRelays]);

  const handleRelayClick = (relay: string) => {
    if (activeRelays.includes("wss://" + relay)) {
      let prunedRelayList = activeRelays.filter((activeRelay: string) => {
        return activeRelay !== "wss://" + relay;
      });
      setIsReady(false);
      console.log("PRUNE RELAY: ACTIVE LIST", prunedRelayList);
      setActiveRelays(prunedRelayList);
      console.log("PRUNE RELAY: INACTIVE LIST", [
        ...inactiveRelays,
        "wss://" + relay,
      ]);
      setInactiveRelays([...inactiveRelays, "wss://" + relay]);
    } else {
      setIsReady(false);
      console.log("ADD RELAY: ACTIVE LIST", [
        ...activeRelays,
        "wss://" + relay,
      ]);
      setActiveRelays([...activeRelays, "wss://" + relay]);
      const updatedInactiveRelays = inactiveRelays.filter(
        (closedRelay: string) => {
          return closedRelay !== "wss://" + relay;
        }
      );
      console.log("ADD RELAY: INACTIVE LIST", updatedInactiveRelays);
      setInactiveRelays(updatedInactiveRelays);
    }
  };

  return (
    <div className="my-3">
      {relayNames && (
        <div className="flex whitespace-nowrap flex-row gap-4 overflow-x-scroll">
          {relayNames.map((relay: string) => {
            return (
              <button
                key={relay}
                onClick={() => handleRelayClick(relay)}
                className={
                  connectedRelays
                    .map((relay: Relay) => relay.url)
                    .includes("wss://" + relay)
                    ? "border border-black bg-black text-white rounded-full p-2"
                    : "border border-black rounded-full p-2"
                }
              >
                {relay}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
