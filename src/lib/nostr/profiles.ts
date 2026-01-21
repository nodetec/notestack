import { create, windowScheduler } from '@yornaath/batshit';
import { nip19 } from 'nostr-tools';
import type { NostrProfile } from '@/components/editor';
import type { NostrEvent } from './types';

const DEFAULT_RELAY = 'wss://relay.damus.io';

export interface Profile {
  pubkey: string;
  name?: string;
  picture?: string;
  nip05?: string;
}

interface ProfileEvent {
  pubkey: string;
  content: string;
  createdAt: number;
}

/**
 * Fetches profile events (kind 0) for multiple pubkeys from a relay
 */
const PROFILE_FETCH_TIMEOUT_MS = 7000;
const PROFILE_BATCH_SIZE = 100;

async function fetchProfileEventsBatch(
  pubkeys: string[],
  relay: string,
  timeoutMs: number
): Promise<ProfileEvent[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: ProfileEvent[] = [];
    const subId = `profiles-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subId, {
        kinds: [0],
        authors: pubkeys,
      }]));

      // Timeout after a short window to avoid hanging on slow relays
      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        resolve(events);
      }, timeoutMs);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2];
          if (event.kind === 0) {
            events.push({
              pubkey: event.pubkey,
              content: event.content,
              createdAt: event.created_at,
            });
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          resolve(events);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      resolve(events);
    };
  });
}

/**
 * Fetches profile events (kind 0) for multiple pubkeys from a relay, batching to avoid relay limits.
 */
async function fetchProfileEvents(
  pubkeys: string[],
  relay: string = DEFAULT_RELAY,
  {
    batchSize = PROFILE_BATCH_SIZE,
    timeoutMs = PROFILE_FETCH_TIMEOUT_MS,
  }: { batchSize?: number; timeoutMs?: number } = {}
): Promise<ProfileEvent[]> {
  if (pubkeys.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < pubkeys.length; i += batchSize) {
    batches.push(pubkeys.slice(i, i + batchSize));
  }

  const results: ProfileEvent[] = [];
  for (const batch of batches) {
    const batchEvents = await fetchProfileEventsBatch(batch, relay, timeoutMs);
    results.push(...batchEvents);
  }

  return results;
}

/**
 * Converts an npub to hex pubkey
 */
function npubToHex(npub: string): string | null {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === 'npub') {
      return decoded.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Batched profile fetcher - collects requests within a 50ms window
 * and fetches all profiles in a single relay request
 */
export const profileBatcher = create({
  fetcher: async (npubs: string[]): Promise<Record<string, NostrProfile | null>> => {
    console.log('[profileBatcher] Fetching profiles for:', npubs);

    // Convert npubs to hex pubkeys
    const npubToHexMap = new Map<string, string>();
    const hexPubkeys: string[] = [];

    for (const npub of npubs) {
      const hex = npubToHex(npub);
      if (hex) {
        npubToHexMap.set(npub, hex);
        hexPubkeys.push(hex);
      }
    }

    console.log('[profileBatcher] Hex pubkeys:', hexPubkeys);

    if (hexPubkeys.length === 0) {
      return Object.fromEntries(npubs.map(npub => [npub, null]));
    }

    // Fetch all profiles in one request
    const events = await fetchProfileEvents(hexPubkeys);
    console.log('[profileBatcher] Received events:', events);

    // Build result map
    const results: Record<string, NostrProfile | null> = {};

    for (const npub of npubs) {
      const hex = npubToHexMap.get(npub);
      if (!hex) {
        results[npub] = null;
        continue;
      }

      const event = events.find(e => e.pubkey === hex);
      if (!event) {
        results[npub] = null;
        continue;
      }

      try {
        const content = JSON.parse(event.content);
        results[npub] = {
          name: content.name || content.display_name,
          picture: content.picture,
          nip05: content.nip05,
        };
      } catch {
        results[npub] = null;
      }
    }

    console.log('[profileBatcher] Results:', results);
    return results;
  },
  resolver: (profiles, npub) => profiles[npub] || null,
  scheduler: windowScheduler(50), // 50ms window for batching
});

/**
 * Look up a profile by npub - uses batching under the hood
 */
export function lookupProfile(npub: string): Promise<NostrProfile | null> {
  return profileBatcher.fetch(npub);
}

/**
 * Fetch profiles for multiple pubkeys from a relay
 * Returns a map of pubkey -> Profile
 */
export async function fetchProfiles(
  pubkeys: string[],
  relay: string | string[] = DEFAULT_RELAY
): Promise<Map<string, Profile>> {
  const uniquePubkeys = [...new Set(pubkeys)];

  if (uniquePubkeys.length === 0) {
    return new Map();
  }

  const result = new Map<string, Profile>();
  const latestByPubkey = new Map<string, number>();
  const relays = Array.isArray(relay) ? relay : [relay];
  const relayResults = await Promise.all(
    relays.map((relayUrl) => fetchProfileEvents(uniquePubkeys, relayUrl))
  );

  for (const events of relayResults) {
    for (const event of events) {
      const previousTimestamp = latestByPubkey.get(event.pubkey);
      if (previousTimestamp !== undefined && previousTimestamp >= event.createdAt) {
        continue;
      }

      try {
        const content = JSON.parse(event.content);
        result.set(event.pubkey, {
          pubkey: event.pubkey,
          name: content.name || content.display_name,
          picture: content.picture,
          nip05: content.nip05,
        });
        latestByPubkey.set(event.pubkey, event.createdAt);
      } catch {
        // Skip invalid profiles
      }
    }
  }

  return result;
}

/**
 * Fetch a single profile event (kind 0) by hex pubkey
 * Returns the full NostrEvent for use with nostr-tools functions like getZapEndpoint
 */
export async function fetchProfileEvent(
  pubkey: string,
  relay: string = DEFAULT_RELAY
): Promise<NostrEvent | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const subId = `profile-event-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subId, {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      }]));

      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          resolve(null);
        }
      }, 5000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 0 && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(null);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(null);
      }
    };
  });
}
