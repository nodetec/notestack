import type { NostrEvent } from './types';
import type { PublishResult } from './publish';

// NIP-01 kind 0 profile content
export interface ProfileContent {
  name?: string;
  about?: string;
  picture?: string;
  website?: string;
  lud16?: string;  // Lightning address
  nip05?: string;
  banner?: string;
  [key: string]: unknown;
}

/**
 * Parse kind 0 event content to ProfileContent
 */
export function parseProfileContent(event: NostrEvent): ProfileContent {
  try {
    return JSON.parse(event.content) as ProfileContent;
  } catch {
    return {};
  }
}

/**
 * Publish kind 0 profile event to relays
 */
export async function publishProfile(
  content: ProfileContent,
  relays: string[]
): Promise<PublishResult[]> {
  if (!window.nostr) {
    throw new Error('No Nostr extension found');
  }

  const pubkey = await window.nostr.getPublicKey();
  const createdAt = Math.floor(Date.now() / 1000);

  const unsignedEvent = {
    kind: 0,
    pubkey,
    created_at: createdAt,
    tags: [],
    content: JSON.stringify(content),
  };

  const signedEvent = await window.nostr.signEvent(unsignedEvent) as NostrEvent;

  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

async function publishToRelay(event: NostrEvent, relay: string): Promise<PublishResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify(['EVENT', event]));

      timeoutId = setTimeout(() => {
        ws.close();
        resolve({ relay, success: false, message: 'Timeout' });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

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
