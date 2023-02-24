"use client";
import { RelayContext } from "./context/relay-provider";
import { useContext, useEffect, useState } from "react";
import { ProfilesContext } from "./context/profiles-provider.jsx";
import Button from "./Button";

export default function FollowedRelays() {
  const { setRelayUrl, activeRelay, allRelays, connect } =
    useContext(RelayContext);
  // @ts-ignore
  const { reload, setReload } = useContext(ProfilesContext);
  const [relayNames, setRelayNames] = useState<string[]>([]);
  const [isRelayConnecting, setIsRelayConnecting] = useState<string>("");

  useEffect(() => {
    const mappedRelayNames = allRelays.map((relay: string) =>
      relay.replace("wss://", "")
    );
    setRelayNames(mappedRelayNames);
  }, [allRelays]);

  const handleRelayClick = async (relay: string) => {
    // console.log("clicked relay:", relay);
    if (activeRelay && activeRelay.url !== "wss://" + relay) {
      setIsRelayConnecting(relay);
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
              <Button
                key={relay}
                onClick={() => handleRelayClick(relay)}
                size="sm"
                loading={
                  activeRelay &&
                  activeRelay.url !== "wss://" + relay &&
                  relay === isRelayConnecting
                }
                variant={
                  activeRelay && activeRelay.url === "wss://" + relay
                    ? "solid"
                    : "outline"
                }
                icon={
                  <div className="h-6 w-6 rounded-full overflow-hidden">
                    <img
                      className="w-full h-full"
                      src={`https://${relayName}/favicon.ico`}
                      alt=""
                    />
                  </div>
                }
              >
                {relay}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
