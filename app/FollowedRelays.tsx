"use client";
import { RelayContext } from "./context/relay-provider";
import { useContext, useEffect, useState } from "react";
import { ProfilesContext } from "./context/profiles-provider.jsx";

export default function FollowedRelays() {
  const { setRelayUrl, activeRelay, allRelays, connect } = useContext(RelayContext);
  // @ts-ignore
  const { reload, setReload } = useContext(ProfilesContext);
  const [relayNames, setRelayNames] = useState<string[]>([]);

  useEffect(() => {
    const mappedRelayNames = allRelays.map((relay: string) =>
      relay.replace("wss://", "")
    );
    setRelayNames(mappedRelayNames);
  }, [allRelays]);

  const handleRelayClick = async (relay: string) => {
    // console.log("clicked relay:", relay);
    if (activeRelay && activeRelay.url !== "wss://" + relay) {
      await connect("wss://" + relay);
      setRelayUrl("wss://" + relay);
      // setActiveRelay();
      setReload(!reload);
    }
  };

  return (
    <div className="my-3">
      {relayNames && (
        <div className="flex whitespace-nowrap scrollable-element flex-row gap-2 overflow-x-scroll">
          {relayNames.map((relay: string) => {
            return (
              <button
                key={relay}
                onClick={() => handleRelayClick(relay)}
                className={
                  activeRelay && activeRelay.url === "wss://" + relay
                    ? "border border-black bg-black text-white text-xs sm:text-base rounded-full px-4 py-2"
                    : "border border-black rounded-full text-xs sm:text-base px-4 py-2"
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
