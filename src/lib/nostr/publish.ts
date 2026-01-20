import type { NostrEvent } from './types';

function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

interface PublishOptions {
  content: string;
  title: string;
  summary?: string;
  image?: string;
  tags?: string[];
  relays: string[];
  dTag?: string; // For editing existing articles - must match original d tag
}

export interface PublishResult {
  relay: string;
  success: boolean;
  message?: string;
}

export async function publishArticle({
  content,
  title,
  summary,
  image,
  tags = [],
  relays,
  dTag: existingDTag,
}: PublishOptions): Promise<PublishResult[]> {
  if (!window.nostr) {
    throw new Error('No Nostr extension found');
  }

  const pubkey = await window.nostr.getPublicKey();
  const createdAt = Math.floor(Date.now() / 1000);
  // Use existing d tag for edits, or generate a random one for new articles
  const dTag = existingDTag || generateId();

  // Build tags array for NIP-23
  const eventTags: string[][] = [
    ['d', dTag],
    ['title', title],
    ['published_at', String(createdAt)],
  ];

  if (summary) {
    eventTags.push(['summary', summary]);
  }

  if (image) {
    eventTags.push(['image', image]);
  }

  // Add hashtags
  for (const tag of tags) {
    eventTags.push(['t', tag.toLowerCase()]);
  }

  const unsignedEvent = {
    kind: 30023,
    pubkey,
    created_at: createdAt,
    tags: eventTags,
    content,
  };

  // Sign the event using NIP-07
  const signedEvent = await window.nostr.signEvent(unsignedEvent) as NostrEvent;

  // Publish to all relays
  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

export async function deleteArticle({
  eventId,
  relays,
}: {
  eventId: string;
  relays: string[];
}): Promise<PublishResult[]> {
  if (!window.nostr) {
    throw new Error('No Nostr extension found');
  }

  const pubkey = await window.nostr.getPublicKey();
  const createdAt = Math.floor(Date.now() / 1000);

  // NIP-09: Deletion event (kind 5)
  // Use 'e' tag to reference the specific event by its id
  // Include 'k' tag specifying the kind being deleted
  const unsignedEvent = {
    kind: 5,
    pubkey,
    created_at: createdAt,
    tags: [
      ['e', eventId],
      ['k', '30023'],
    ],
    content: '',
  };

  const signedEvent = (await window.nostr.signEvent(unsignedEvent)) as NostrEvent;

  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

export async function broadcastEvent(
  event: NostrEvent,
  relays: string[]
): Promise<PublishResult[]> {
  return Promise.all(relays.map((relay) => publishToRelay(event, relay)));
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
