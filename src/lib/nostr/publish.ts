import type { NostrEvent } from './types';
import { signEvent, getSignerPublicKey } from './signing';

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
  secretKey?: string; // For signing with nsec instead of NIP-07
}

export interface PublishResult {
  relay: string;
  success: boolean;
  message?: string;
}

interface CodeSnippetOptions {
  content: string;
  language?: string;
  name?: string;
  extension?: string;
  description?: string;
  license?: string;
  licenseUrl?: string;
  relays: string[];
  secretKey?: string; // For signing with nsec instead of NIP-07
}

export async function publishArticle({
  content,
  title,
  summary,
  image,
  tags = [],
  relays,
  dTag: existingDTag,
  secretKey,
}: PublishOptions): Promise<PublishResult[]> {
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
    created_at: createdAt,
    tags: eventTags,
    content,
  };

  // Sign the event using secret key or NIP-07
  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  // Publish to all relays
  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

export async function deleteArticle({
  eventId,
  relays,
  secretKey,
}: {
  eventId: string;
  relays: string[];
  secretKey?: string;
}): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  // NIP-09: Deletion event (kind 5)
  // Use 'e' tag to reference the specific event by its id
  // Include 'k' tag specifying the kind being deleted
  const unsignedEvent = {
    kind: 5,
    created_at: createdAt,
    tags: [
      ['e', eventId],
      ['k', '30023'],
    ],
    content: '',
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

export async function deleteDraft({
  eventId,
  relays,
  secretKey,
}: {
  eventId: string;
  relays: string[];
  secretKey?: string;
}): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  const unsignedEvent = {
    kind: 5,
    created_at: createdAt,
    tags: [
      ['e', eventId],
      ['k', '30024'],
    ],
    content: 'Draft deleted',
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

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

// NIP-84: Publish a highlight (kind 9802)
interface HighlightOptions {
  content: string; // The highlighted text
  context?: string; // Surrounding text for context
  source: {
    kind: number;
    pubkey: string;
    identifier: string; // d-tag for addressable events
    relay?: string; // Relay hint
  };
  authorPubkey?: string; // Attribution to original author
  relays: string[];
  secretKey?: string; // For signing with nsec instead of NIP-07
}

export interface PublishHighlightResult {
  results: PublishResult[];
  event: {
    id: string;
    pubkey: string;
    createdAt: number;
  };
}

export async function publishHighlight({
  content,
  context,
  source,
  authorPubkey,
  relays,
  secretKey,
}: HighlightOptions): Promise<PublishHighlightResult> {
  const createdAt = Math.floor(Date.now() / 1000);

  // Build tags array for NIP-84
  const eventTags: string[][] = [];

  // Reference the source article with 'a' tag (for addressable events like kind:30023)
  // Format: ["a", "<kind>:<pubkey>:<d-tag>", "<relay-url>"]
  const aTagValue = `${source.kind}:${source.pubkey}:${source.identifier}`;
  if (source.relay) {
    eventTags.push(['a', aTagValue, source.relay]);
  } else {
    eventTags.push(['a', aTagValue]);
  }

  // Add author attribution if provided
  if (authorPubkey) {
    eventTags.push(['p', authorPubkey, '', 'author']);
  }

  // Add context if provided
  if (context) {
    eventTags.push(['context', context]);
  }

  const unsignedEvent = {
    kind: 9802,
    created_at: createdAt,
    tags: eventTags,
    content,
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
    },
  };
}

const NOTEBIN_RELAY = 'wss://relay.notebin.io';

export async function publishCodeSnippet({
  content,
  language,
  name,
  extension,
  description,
  license,
  licenseUrl,
  relays,
  secretKey,
}: CodeSnippetOptions): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  // Always include notebin relay for kind 1337 events
  const allRelays = relays.includes(NOTEBIN_RELAY)
    ? relays
    : [...relays, NOTEBIN_RELAY];

  const eventTags: string[][] = [];

  if (language) {
    eventTags.push(['l', language.toLowerCase()]);
  }
  if (name) {
    eventTags.push(['name', name]);
  }
  if (extension) {
    eventTags.push(['extension', extension.replace(/^\./, '')]);
  }
  if (description) {
    eventTags.push(['description', description]);
  }
  if (license) {
    if (licenseUrl) {
      eventTags.push(['license', license, licenseUrl]);
    } else {
      eventTags.push(['license', license]);
    }
  }

  const unsignedEvent = {
    kind: 1337,
    created_at: createdAt,
    tags: eventTags,
    content,
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  return Promise.all(allRelays.map((relay) => publishToRelay(signedEvent, relay)));
}

// NIP-09: Delete a highlight
export async function deleteHighlight({
  eventId,
  relays,
  secretKey,
}: {
  eventId: string;
  relays: string[];
  secretKey?: string;
}): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  // NIP-09: Deletion event (kind 5)
  const unsignedEvent = {
    kind: 5,
    created_at: createdAt,
    tags: [
      ['e', eventId],
      ['k', '9802'], // kind being deleted
    ],
    content: 'Highlight deleted',
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

// NIP-02: Publish updated contact/follow list (kind 3)
interface ContactListOptions {
  tags: string[][]; // Full list of p tags (and any other tags)
  content?: string; // Usually empty, but some clients store relay list here
  relays: string[];
  secretKey?: string;
}

export async function publishContactList({
  tags,
  content = '',
  relays,
  secretKey,
}: ContactListOptions): Promise<PublishResult[]> {
  const createdAt = Math.floor(Date.now() / 1000);

  const unsignedEvent = {
    kind: 3,
    created_at: createdAt,
    tags,
    content,
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
