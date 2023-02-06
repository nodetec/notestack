"use client";
import { RelayContext } from "./context/relay-provider.jsx";
import { useContext, useEffect, useState } from "react";
import { ProfilesContext } from "./context/profiles-provider.jsx";

export default function FollowedRelays() {
  // @ts-ignore
  const { setPendingActiveRelayUrl, activeRelay, setActiveRelay, allRelays } =
    useContext(RelayContext);
  // @ts-ignore
  const { reload, setReload } = useContext(ProfilesContext);
  const [relayNames, setRelayNames] = useState<string[]>([]);

  useEffect(() => {
    const mappedRelayNames = allRelays.map((relay: string) =>
      relay.replace("wss://", "")
    );
    setRelayNames(mappedRelayNames);
  }, [allRelays]);

  const handleRelayClick = (relay: string) => {
    console.log("clicked relay:", relay);
    if (activeRelay && activeRelay.url !== "wss://" + relay) {
      setPendingActiveRelayUrl("wss://" + relay);
      setActiveRelay(null);
      setReload(!reload);
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
                  activeRelay && activeRelay.url === "wss://" + relay
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
