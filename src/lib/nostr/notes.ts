import { create, windowScheduler, type Batcher } from '@yornaath/batshit';
import { nip19 } from 'nostr-tools';
import type { NostrNote } from '@/components/editor';
import { fetchProfiles } from './profiles';

const DEFAULT_RELAY = 'wss://antiprimal.net';

interface NoteEvent {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
}

/**
 * Decodes an nevent bech32 string to get the event ID
 */
function neventToEventId(nevent: string): string | null {
  try {
    const decoded = nip19.decode(nevent);
    if (decoded.type === 'nevent') {
      return decoded.data.id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches note events (kind 1) for multiple event IDs from a relay
 */
async function fetchNoteEvents(
  eventIds: string[],
  relay: string = DEFAULT_RELAY
): Promise<NoteEvent[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: NoteEvent[] = [];
    const subId = `notes-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subId, {
        kinds: [1],
        ids: eventIds,
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
          if (event.kind === 1) {
            events.push({
              id: event.id,
              pubkey: event.pubkey,
              content: event.content,
              created_at: event.created_at,
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

type NoteBatcher = Batcher<Record<string, NostrNote | null>, string, NostrNote | null>;
const noteBatchers = new Map<string, NoteBatcher>();

function resolveRelay(relay?: string): string {
  return relay || DEFAULT_RELAY;
}

function getNoteBatcher(relay?: string): NoteBatcher {
  const relayUrl = resolveRelay(relay);
  const existing = noteBatchers.get(relayUrl);
  if (existing) return existing;

  const batcher: NoteBatcher = create({
    fetcher: async (nevents: string[]): Promise<Record<string, NostrNote | null>> => {
      console.log('[noteBatcher] Fetching notes for:', nevents);

      // Convert nevents to event IDs
      const neventToIdMap = new Map<string, string>();
      const eventIds: string[] = [];

      for (const nevent of nevents) {
        const id = neventToEventId(nevent);
        if (id) {
          neventToIdMap.set(nevent, id);
          eventIds.push(id);
        }
      }

      console.log('[noteBatcher] Event IDs:', eventIds);

      if (eventIds.length === 0) {
        return Object.fromEntries(nevents.map(nevent => [nevent, null]));
      }

      // Fetch all notes from the selected active relay.
      const noteEvents = await fetchNoteEvents(eventIds, relayUrl);
      console.log('[noteBatcher] Received note events:', noteEvents);

      // Profile lookups are always resolved via Purplepages.
      const pubkeys = [...new Set(noteEvents.map(e => e.pubkey))];
      const profiles = await fetchProfiles(pubkeys);

      // Build result map
      const results: Record<string, NostrNote | null> = {};

      for (const nevent of nevents) {
        const eventId = neventToIdMap.get(nevent);
        if (!eventId) {
          results[nevent] = null;
          continue;
        }

        const noteEvent = noteEvents.find(e => e.id === eventId);
        if (!noteEvent) {
          results[nevent] = null;
          continue;
        }

        const profile = profiles.get(noteEvent.pubkey);
        results[nevent] = {
          content: noteEvent.content,
          authorName: profile?.name,
          authorPicture: profile?.picture,
          createdAt: noteEvent.created_at,
        };
      }

      console.log('[noteBatcher] Results:', results);
      return results;
    },
    resolver: (notes, nevent) => notes[nevent] || null,
    scheduler: windowScheduler(50), // 50ms window for batching
  });

  noteBatchers.set(relayUrl, batcher);
  return batcher;
}

/**
 * Default batcher for compatibility with existing imports.
 */
export const noteBatcher = getNoteBatcher(DEFAULT_RELAY);

/**
 * Look up a note by nevent - uses batching under the hood
 */
export function lookupNote(nevent: string, relay?: string): Promise<NostrNote | null> {
  return getNoteBatcher(relay).fetch(nevent);
}
