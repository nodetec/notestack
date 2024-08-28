import { SimplePool, type Event } from "nostr-tools";

export interface RelayMetadata {
  relays: string[];
  readRelays: string[];
  writeRelays: string[];
}

export async function getRelayMetadataEvent(
  relays: string[],
  publicKey: string | undefined,
) {
  if (!publicKey) {
    return null;
  }

  const pool = new SimplePool();

  const relayEvent = await pool.get(relays, {
    kinds: [10002],
    authors: [publicKey],
  });

  pool.close(relays);

  return relayEvent;
}

export function parseRelayMetadataEvent(event: Event): RelayMetadata {
  // TODO: check if tag[1] is undefined
  const relays = event?.tags?.map((tag) => tag[1]!) ?? [];
  
  const readRelays = event?.tags
    ?.filter((tag) => tag[2] !== "write")
    .map((tag) => tag[1]!) ?? [];
  
  const writeRelays = event?.tags
    ?.filter((tag) => tag[2] !== "read")
    .map((tag) => tag[1]!) ?? [];

  return { relays, readRelays, writeRelays };
}
