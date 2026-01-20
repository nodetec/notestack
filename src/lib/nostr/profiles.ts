import { create, windowScheduler } from '@yornaath/batshit';
import { nip19 } from 'nostr-tools';
import type { NostrProfile } from '@/components/editor';

const DEFAULT_RELAY = 'wss://relay.damus.io';

interface ProfileEvent {
  pubkey: string;
  content: string;
}

/**
 * Fetches profile events (kind 0) for multiple pubkeys from a relay
 */
async function fetchProfileEvents(
  pubkeys: string[],
  relay: string = DEFAULT_RELAY
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

      // Timeout after 5 seconds
      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        resolve(events);
      }, 5000);
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
