"use client";

import { useMemo } from "react";

import { useRelayMetadataEvent } from "~/hooks/useRelayMetadataEvent";
import { parseRelayMetadataEvent } from "~/lib/events/relay-metadata-event";

import { RelayForm } from "./RelayForm";

type Props = {
  userPublicKey: string;
};

export function RelaySettings({ userPublicKey }: Props) {
  const { data: relayMetadataEvent, status } =
    useRelayMetadataEvent(userPublicKey);

  const relayMetadata = useMemo(
    () =>
      relayMetadataEvent ? parseRelayMetadataEvent(relayMetadataEvent) : null,
    [relayMetadataEvent],
  );

  if (status === "pending") {
    return <div>Loading...</div>;
  }

  const relays = relayMetadata?.relays ?? [];
  const readRelays = relayMetadata?.readRelays ?? [];
  const writeRelays = relayMetadata?.writeRelays ?? [];

  let formValues = {
    relays: relays.map((url) => ({
      url,
      read: readRelays.includes(url),
      write: writeRelays.includes(url),
    })),
  };

  if (formValues.relays.length === 0) {
    formValues = { relays: [{ url: "", read: true, write: true }] };
  }

  return (
    <div className="w-full">
      <RelayForm defaultValues={formValues} />
    </div>
  );
}
