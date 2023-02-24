"use client";
import { RelayContext } from "./context/relay-provider";
import { useContext, useEffect, useState } from "react";
import { ProfilesContext } from "./context/profiles-provider.jsx";

export default function FollowedRelays() {
  const { setRelayUrl, activeRelay, allRelays, connect } =
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
            const relayName = relay.replace("relay.", "");
            return (
              <button
                key={relay}
                onClick={() => handleRelayClick(relay)}
                className={
                  activeRelay && activeRelay.url === "wss://" + relay
                    ? "w-full flex flex-row gap-2 box-border border border-black bg-black text-white text-xs justify-center items-center sm:text-base rounded-full px-7 py-2"
                    : "w-full flex flex-row gap-2 box-border border border-black rounded-full text-xs justify-center items-center sm:text-base px-7 py-2"
                }
              >
                  <img
                    className="rounded-full h-6"
                    src={`https://${relayName}/favicon.ico`}
                    alt={""}
                  />
                  <span>{relay}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
