import type { NostrEvent, Stack, StackItem } from './types';
import { eventToStack } from './types';
import { signEvent, getSignerPublicKey } from './signing';

interface FetchStacksOptions {
  pubkey: string;
  relay?: string;
}

interface PublishStackOptions {
  dTag: string;
  name: string;
  description?: string;
  image?: string;
  items: StackItem[];
  relays: string[];
  secretKey?: string; // For signing with nsec instead of NIP-07
}

export interface PublishResult {
  relay: string;
  success: boolean;
  message?: string;
}

export interface PublishStackResult {
  results: PublishResult[];
  event: {
    id: string;
    pubkey: string;
    createdAt: number;
    dTag: string;
  };
}

// Fetch user's stacks (kind 30003 bookmark sets)
export async function fetchUserStacks({
  pubkey,
  relay = 'wss://relay.damus.io',
}: FetchStacksOptions): Promise<Stack[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `stacks-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      const filter = {
        kinds: [30003],
        authors: [pubkey],
        limit: 100,
      };

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        // Deduplicate by dTag (keep latest)
        const stacksByDTag = new Map<string, NostrEvent>();
        for (const event of events) {
          const dTag = event.tags.find((t) => t[0] === 'd')?.[1] || '';
          const existing = stacksByDTag.get(dTag);
          if (!existing || event.created_at > existing.created_at) {
            stacksByDTag.set(dTag, event);
          }
        }
        resolve(Array.from(stacksByDTag.values()).map(eventToStack));
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 30003) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          // Deduplicate by dTag (keep latest)
          const stacksByDTag = new Map<string, NostrEvent>();
          for (const event of events) {
            const dTag = event.tags.find((t) => t[0] === 'd')?.[1] || '';
            const existing = stacksByDTag.get(dTag);
            if (!existing || event.created_at > existing.created_at) {
              stacksByDTag.set(dTag, event);
            }
          }
          resolve(Array.from(stacksByDTag.values()).map(eventToStack));
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      resolve([]);
    };
  });
}

// Publish or update a stack (kind 30003)
export async function publishStack({
  dTag,
  name,
  description,
  image,
  items,
  relays,
  secretKey,
}: PublishStackOptions): Promise<PublishStackResult> {
  const createdAt = Math.floor(Date.now() / 1000);

  // Build tags array for NIP-51 bookmark set
  const eventTags: string[][] = [
    ['d', dTag],
    ['title', name],
  ];

  if (description) {
    eventTags.push(['description', description]);
  }

  if (image) {
    eventTags.push(['image', image]);
  }

  // Add article references as 'a' tags
  for (const item of items) {
    const aTagValue = `${item.kind}:${item.pubkey}:${item.identifier}`;
    if (item.relay) {
      eventTags.push(['a', aTagValue, item.relay]);
    } else {
      eventTags.push(['a', aTagValue]);
    }
  }

  const unsignedEvent = {
    kind: 30003,
    created_at: createdAt,
    tags: eventTags,
    content: '', // NIP-51 bookmark sets typically have empty content
  };

  // Sign the event using secret key or NIP-07
  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  // Publish to all relays
  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return {
    results,
    event: {
      id: signedEvent.id,
      pubkey: signedEvent.pubkey,
      createdAt: signedEvent.created_at,
      dTag,
    },
  };
}

// Delete a stack via NIP-09
export async function deleteStack({
  eventId,
  dTag,
  relays,
  secretKey,
}: {
  eventId: string;
  dTag: string;
  relays: string[];
  secretKey?: string;
}): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  // Get the pubkey first for the 'a' tag
  const pubkey = await getSignerPublicKey(secretKey);

  // NIP-09: Deletion event (kind 5)
  // For addressable events (like 30003), use 'a' tag
  const unsignedEvent = {
    kind: 5,
    created_at: createdAt,
    tags: [
      ['e', eventId],
      ['a', `30003:${pubkey}:${dTag}`],
      ['k', '30003'],
    ],
    content: 'Stack deleted',
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  return Promise.all(relays.map((relay) => publishToRelay(signedEvent, relay)));
}

async function publishToRelay(event: NostrEvent, relay: string): Promise<PublishResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify(['EVENT', event]));

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        ws.close();
        resolve({ relay, success: false, message: 'Timeout' });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // NIP-20: Command Results
        if (data[0] === 'OK' && data[1] === event.id) {
          clearTimeout(timeoutId);
          ws.close();

          if (data[2] === true) {
            resolve({ relay, success: true });
          } else {
            resolve({ relay, success: false, message: data[3] || 'Rejected' });
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ relay, success: false, message: 'Connection error' });
    };
  });
}
