import type { NostrEvent, Comment } from './types';
import { eventToComment } from './types';
import type { PublishResult } from './publish';
import { signEvent } from './signing';

interface FetchCommentsOptions {
  articlePubkey: string;
  articleIdentifier: string;
  relay?: string;
}

export async function fetchArticleComments({
  articlePubkey,
  articleIdentifier,
  relay = 'wss://relay.damus.io',
}: FetchCommentsOptions): Promise<Comment[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `comments-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    // Build the 'A' tag value to search for (root scope)
    const ATagValue = `30023:${articlePubkey}:${articleIdentifier}`;

    ws.onopen = () => {
      const filter = {
        kinds: [1111],
        '#A': [ATagValue],
        limit: 200,
      };

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const comments = events
          .map(eventToComment)
          .filter((c): c is Comment => c !== null);
        resolve(comments);
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 1111) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const comments = events
            .map(eventToComment)
            .filter((c): c is Comment => c !== null);
          resolve(comments);
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

interface PublishCommentOptions {
  content: string;
  article: {
    pubkey: string;
    identifier: string;
    eventId?: string;
  };
  parentComment?: {
    id: string;
    pubkey: string;
  };
  relays: string[];
  secretKey?: string; // For signing with nsec instead of NIP-07
}

export interface PublishCommentResult {
  results: PublishResult[];
  comment: Comment;
}

export async function publishComment({
  content,
  article,
  parentComment,
  relays,
  secretKey,
}: PublishCommentOptions): Promise<PublishCommentResult> {
  const createdAt = Math.floor(Date.now() / 1000);

  // Build NIP-22 tags
  const eventTags: string[][] = [];

  // Uppercase tags (root scope - the article)
  eventTags.push(['A', `30023:${article.pubkey}:${article.identifier}`]);
  if (article.eventId) {
    eventTags.push(['E', article.eventId]);
  }
  eventTags.push(['K', '30023']);
  eventTags.push(['P', article.pubkey]);

  // Lowercase tags (parent)
  if (parentComment) {
    // Replying to another comment
    eventTags.push(['a', `1111:${parentComment.pubkey}:${parentComment.id}`]);
    eventTags.push(['e', parentComment.id]);
    eventTags.push(['k', '1111']);
    eventTags.push(['p', parentComment.pubkey]);
  } else {
    // Top-level comment on article
    eventTags.push(['a', `30023:${article.pubkey}:${article.identifier}`]);
    if (article.eventId) {
      eventTags.push(['e', article.eventId]);
    }
    eventTags.push(['k', '30023']);
    eventTags.push(['p', article.pubkey]);
  }

  const unsignedEvent = {
    kind: 1111,
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

  // Build the comment object for optimistic update
  const comment: Comment = {
    id: signedEvent.id,
    pubkey: signedEvent.pubkey,
    createdAt: signedEvent.created_at,
    content,
    root: {
      kind: 30023,
      pubkey: article.pubkey,
      identifier: article.identifier,
      eventId: article.eventId,
    },
    parent: parentComment
      ? {
          kind: 1111,
          pubkey: parentComment.pubkey,
          identifier: parentComment.id,
          eventId: parentComment.id,
        }
      : {
          kind: 30023,
          pubkey: article.pubkey,
          identifier: article.identifier,
          eventId: article.eventId,
        },
    replyTo: parentComment?.id,
  };

  return { results, comment };
}

export async function deleteComment({
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
      ['k', '1111'],
    ],
    content: 'Comment deleted',
  };

  const signedEvent = await signEvent({ event: unsignedEvent, secretKey });

  const results = await Promise.all(
    relays.map((relay) => publishToRelay(signedEvent, relay))
  );

  return results;
}

async function publishToRelay(
  event: NostrEvent,
  relay: string
): Promise<PublishResult> {
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
