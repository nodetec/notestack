import { create, windowScheduler } from '@yornaath/batshit';
import { nip19, SimplePool } from 'nostr-tools';
import type { NostrProfile } from '@/components/editor';
import type { NostrEvent } from './types';

const DEFAULT_PROFILE_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://purplepag.es',
];

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
const PROFILE_BATCH_SIZE = 100;

/**
 * Fetches profile events (kind 0) for multiple pubkeys from a relay, batching to avoid relay limits.
 */
async function fetchProfileEvents(
  pubkeys: string[],
  relay: string | string[] = DEFAULT_PROFILE_RELAYS,
  {
    batchSize = PROFILE_BATCH_SIZE,
  }: { batchSize?: number } = {}
): Promise<ProfileEvent[]> {
  if (pubkeys.length === 0) return [];

  const relays = normalizeRelays(relay);
  const pool = new SimplePool();
  const batches: string[][] = [];
  for (let i = 0; i < pubkeys.length; i += batchSize) {
    batches.push(pubkeys.slice(i, i + batchSize));
  }

  const results: ProfileEvent[] = [];
  try {
    for (const batch of batches) {
      const events = await pool.querySync(
        relays,
        { kinds: [0], authors: batch },
        { id: `profiles-${Date.now()}` }
      );
      for (const event of events) {
        if (event.kind === 0) {
          results.push({
            pubkey: event.pubkey,
            content: event.content,
            createdAt: event.created_at,
          });
        }
      }
    }
    return results;
  } finally {
    pool.close(relays);
  }
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

function normalizePubkey(pubkey: string): string | null {
  if (!pubkey) return null;
  if (pubkey.startsWith('npub1') || pubkey.startsWith('nprofile1')) {
    try {
      const decoded = nip19.decode(pubkey);
      if (decoded.type === 'npub') {
        return decoded.data;
      }
      if (decoded.type === 'nprofile' && typeof decoded.data === 'object' && decoded.data && 'pubkey' in decoded.data) {
        return decoded.data.pubkey as string;
      }
      return null;
    } catch {
      return null;
    }
  }
  return pubkey;
}

function normalizeRelays(relay?: string | string[]): string[] {
  if (!relay) return DEFAULT_PROFILE_RELAYS;
  const relays = Array.isArray(relay) ? relay : [relay];
  const filtered = relays.filter(Boolean);
  return filtered.length > 0 ? filtered : DEFAULT_PROFILE_RELAYS;
}

const profileBatchers = new Map<string, ReturnType<typeof create>>();

function getProfileBatcher(relay: string | string[]) {
  const relays = normalizeRelays(relay);
  const relayKey = relays.join('|');
  const existing = profileBatchers.get(relayKey);
  if (existing) return existing;

  const batcher = create({
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
      const events = await fetchProfileEvents(hexPubkeys, relays);
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

  profileBatchers.set(relayKey, batcher);
  return batcher;
}

/**
 * Batched profile fetcher - collects requests within a 50ms window
 * and fetches all profiles in a single relay request
 */
export const profileBatcher = getProfileBatcher(DEFAULT_PROFILE_RELAYS);

/**
 * Look up a profile by npub - uses batching under the hood
 */
export function lookupProfile(npub: string, relays?: string | string[]): Promise<NostrProfile | null> {
  return getProfileBatcher(relays ?? DEFAULT_PROFILE_RELAYS).fetch(npub);
}

/**
 * Fetch profiles for multiple pubkeys from a relay
 * Returns a map of pubkey -> Profile
 */
export async function fetchProfiles(
  pubkeys: string[],
  relay: string | string[] = DEFAULT_PROFILE_RELAYS
): Promise<Map<string, Profile>> {
  const inputToHex = new Map<string, string>();
  const hexToInputs = new Map<string, string[]>();
  for (const input of pubkeys) {
    const hex = normalizePubkey(input);
    if (!hex) continue;
    inputToHex.set(input, hex);
    if (!hexToInputs.has(hex)) {
      hexToInputs.set(hex, []);
    }
    hexToInputs.get(hex)!.push(input);
  }

  const uniquePubkeys = [...new Set(inputToHex.values())];

  if (uniquePubkeys.length === 0) {
    return new Map();
  }

  const result = new Map<string, Profile>();
  const latestByPubkey = new Map<string, number>();
  const relays = normalizeRelays(relay);
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
        const inputs = hexToInputs.get(event.pubkey) ?? [event.pubkey];
        for (const input of inputs) {
          result.set(input, {
            pubkey: event.pubkey,
            name: content.name || content.display_name,
            picture: content.picture,
            nip05: content.nip05,
          });
        }
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
  relay: string | string[] = DEFAULT_PROFILE_RELAYS
): Promise<NostrEvent | null> {
  const relays = normalizeRelays(relay);
  const pool = new SimplePool();
  try {
    const event = await pool.get(relays, {
      kinds: [0],
      authors: [pubkey],
      limit: 1,
    });
    return (event as NostrEvent | null) ?? null;
  } finally {
    pool.close(relays);
  }
}
