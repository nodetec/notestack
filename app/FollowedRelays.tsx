"use client";
import { RelayContext } from "./context/relay-provider.jsx";
import { useContext, useEffect, useState } from "react";

export default function FollowedRelays() {
  // @ts-ignore
  const { activeRelays, setActiveRelays, allRelays, setClosedRelays } =
    useContext(RelayContext);
  const [relayNames, setRelayNames] = useState<string[]>([]);

  useEffect(() => {
    const mappedRelayNames = allRelays.map((relay: string) =>
      relay.replace("wss://", "")
    );
    // setRelayNames(["all", ...mappedRelayNames]);
    setRelayNames(mappedRelayNames);
  }, [activeRelays]);

  const handleRelayClick = (relay: string) => {
    sessionStorage.removeItem("latest_events");

    // if it's all add all
    // make sure to clear cache
    // add total relays and active relays to localstorage
    if (activeRelays.includes("wss://" + relay)) {
      let prunedRelayList = activeRelays.filter((activeRelay: string) => {
        return activeRelay !== "wss://" + relay;
      });
      console.log("PRUNED RELAY LIST", prunedRelayList);
      setActiveRelays(prunedRelayList);
      setClosedRelays(["wss://" + relay]);
    } else {
      setActiveRelays([...activeRelays, "wss://" + relay]);
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
                  activeRelays.includes("wss://" + relay)
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
