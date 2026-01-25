import { SimplePool, nip44 } from 'nostr-tools';
import { hexToBytes } from 'nostr-tools/utils';
import type { NostrEvent } from './types';
import type { Draft } from '@/lib/stores/draftStore';
import { signEvent } from './signing';

const DRAFT_KIND = 30024;

interface SyncResult {
  received: number;
  updated: number;
}

function getCheckpointKey(pubkey: string, relay: string) {
  return `notestack:draft-sync:nip23:${relay}:${pubkey}`;
}

function readCheckpoint(pubkey: string, relay: string): number {
  const raw = localStorage.getItem(getCheckpointKey(pubkey, relay));
  const since = Number(raw) || 0;
  return Number.isFinite(since) ? since : 0;
}

function writeCheckpoint(pubkey: string, relay: string, since: number) {
  localStorage.setItem(getCheckpointKey(pubkey, relay), String(since));
}

function getTag(event: NostrEvent, tagName: string): string | undefined {
  return event.tags.find((tag) => tag[0] === tagName)?.[1];
}

function getDraftId(event: NostrEvent): string | null {
  return getTag(event, 'd') ?? null;
}

function parseArticlePointer(event: NostrEvent): Draft['linkedBlog'] | undefined {
  const aTag = event.tags.find((tag) => tag[0] === 'a' && tag[1]);
  if (!aTag || !aTag[1]) return undefined;
  const [kind, pubkey, dTag] = aTag[1].split(':');
  if (kind !== '30023' || !pubkey || !dTag) return undefined;
  return {
    pubkey,
    dTag,
    title: getTag(event, 'title'),
    summary: getTag(event, 'summary'),
    image: getTag(event, 'image'),
    tags: event.tags.filter((tag) => tag[0] === 't').map((tag) => tag[1]),
  };
}

function eventToDraft(event: NostrEvent, content: string): Draft | null {
  const draftId = getDraftId(event);
  if (!draftId) return null;
  const linkedBlog = parseArticlePointer(event);

  return {
    id: draftId,
    content,
    lastSaved: event.created_at * 1000,
    linkedBlog,
    remoteEventId: event.id,
  };
}

function isEncrypted(event: NostrEvent) {
  return event.tags.some((tag) => tag[0] === 'enc' && tag[1] === 'nip44');
}

async function encryptDraftContent(content: string, pubkey: string, secretKey?: string) {
  if (secretKey) {
    const conversationKey = nip44.v2.utils.getConversationKey(hexToBytes(secretKey), pubkey);
    return nip44.encrypt(content, conversationKey);
  }

  if (typeof window !== 'undefined' && window.nostr?.nip44?.encrypt) {
    return window.nostr.nip44.encrypt(pubkey, content);
  }

  throw new Error('No NIP-44 encryption available');
}

async function decryptDraftContent(payload: string, pubkey: string, secretKey?: string) {
  if (secretKey) {
    const conversationKey = nip44.v2.utils.getConversationKey(hexToBytes(secretKey), pubkey);
    return nip44.decrypt(payload, conversationKey);
  }

  if (typeof window !== 'undefined' && window.nostr?.nip44?.decrypt) {
    return window.nostr.nip44.decrypt(pubkey, payload);
  }

  throw new Error('No NIP-44 decryption available');
}

async function publishToRelay(event: NostrEvent, relay: string) {
  return new Promise<{ success: boolean; message?: string }>((resolve) => {
    const ws = new WebSocket(relay);
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      ws.send(JSON.stringify(['EVENT', event]));
      timeoutId = setTimeout(() => {
        ws.close();
        resolve({ success: false, message: 'Timeout' });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data[0] === 'OK' && data[1] === event.id) {
          clearTimeout(timeoutId);
          ws.close();
          resolve({ success: data[2] === true, message: data[3] });
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ success: false, message: 'Connection error' });
    };
  });
}

async function publishDraft(draft: Draft, relays: string[], pubkey: string, secretKey?: string) {
  const tags: string[][] = [
    ['d', draft.id],
    ['client', 'notestack'],
    ['enc', 'nip44'],
    ['p', pubkey],
  ];

  if (draft.linkedBlog) {
    tags.push(['a', `30023:${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}`]);
    if (draft.linkedBlog.title) tags.push(['title', draft.linkedBlog.title]);
    if (draft.linkedBlog.summary) tags.push(['summary', draft.linkedBlog.summary]);
    if (draft.linkedBlog.image) tags.push(['image', draft.linkedBlog.image]);
    if (draft.linkedBlog.tags?.length) {
      for (const tag of draft.linkedBlog.tags) {
        tags.push(['t', tag.toLowerCase()]);
      }
    }
  }

  const createdAt = Math.floor(draft.lastSaved / 1000);
  const encryptedContent = await encryptDraftContent(draft.content, pubkey, secretKey);
  const signedEvent = await signEvent({
    event: {
      kind: DRAFT_KIND,
      created_at: createdAt,
      tags,
      content: encryptedContent,
    },
    secretKey,
  });

  const results = await Promise.all(relays.map((relay) => publishToRelay(signedEvent, relay)));
  const successRelays = results.reduce<string[]>((acc, result, index) => {
    if (result.success) acc.push(relays[index]);
    return acc;
  }, []);
  return { successRelays, eventId: signedEvent.id };
}

export async function syncDrafts({
  drafts,
  pubkey,
  relays,
  onDraftReceived,
  onDraftDeleted,
  secretKey,
}: {
  drafts: Draft[];
  pubkey: string;
  relays: string[];
  onDraftReceived: (draft: Draft) => void;
  onDraftDeleted?: (draftId: string) => void;
  secretKey?: string;
}): Promise<SyncResult> {
  if (!relays.length) {
    return { received: 0, updated: 0 };
  }

  const pool = new SimplePool();
  const relaySince = new Map<string, number>();
  const relayLatest = new Map<string, number>();

  let received = 0;
  let updated = 0;

  const localDrafts = new Map(drafts.map((draft) => [draft.id, draft]));

  try {
    for (const relay of relays) {
      const since = readCheckpoint(pubkey, relay);
      relaySince.set(relay, since);
      relayLatest.set(relay, since);

      const events = await pool.querySync([relay], {
        kinds: [DRAFT_KIND, 5],
        authors: [pubkey],
        since,
      });
      console.log('[draftSync] relay', relay, 'since', since, 'events', events);

      for (const event of events) {
        const latest = relayLatest.get(relay) ?? 0;
        if (event.created_at > latest) {
          relayLatest.set(relay, event.created_at);
        }

        if (event.kind === 5) {
          const kindTags = event.tags.filter((tag) => tag[0] === 'k').map((tag) => tag[1]);
          if (!kindTags.includes(String(DRAFT_KIND))) {
            continue;
          }
          const deletedIds = event.tags.filter((tag) => tag[0] === 'e').map((tag) => tag[1]);
          if (deletedIds.length === 0) continue;
          for (const [draftId, draft] of localDrafts.entries()) {
            if (draft.remoteEventId && deletedIds.includes(draft.remoteEventId)) {
              onDraftDeleted?.(draftId);
            }
          }
          continue;
        }

        let content = event.content;
        if (isEncrypted(event)) {
          try {
            content = await decryptDraftContent(event.content, pubkey, secretKey);
          } catch {
            continue;
          }
        }
        const draft = eventToDraft(event, content);
        if (!draft) continue;
        received += 1;
        const existing = localDrafts.get(draft.id);
        if (!existing || draft.lastSaved > existing.lastSaved) {
          updated += 1;
          onDraftReceived(draft);
        }
      }
    }
  } finally {
    pool.close(relays);
  }

  for (const relay of relays) {
    const latest = relayLatest.get(relay) ?? 0;
    const since = relaySince.get(relay) ?? 0;
    if (latest > since) {
      const nextSince = latest + 1;
      writeCheckpoint(pubkey, relay, nextSince);
      relaySince.set(relay, nextSince);
    }
  }

  return { received, updated };
}

export async function publishDrafts({
  drafts,
  pubkey,
  relays,
  secretKey,
  onDraftPublished,
}: {
  drafts: Draft[];
  pubkey: string;
  relays: string[];
  secretKey?: string;
  onDraftPublished?: (draftId: string, eventId: string) => void;
}): Promise<{ published: number }> {
  if (!relays.length) return { published: 0 };

  let published = 0;
  for (const draft of drafts) {
    try {
      const { successRelays, eventId } = await publishDraft(draft, relays, pubkey, secretKey);
      if (successRelays.length > 0) {
        published += 1;
        onDraftPublished?.(draft.id, eventId);
        const createdAt = Math.floor(draft.lastSaved / 1000);
        for (const relay of successRelays) {
          const since = readCheckpoint(pubkey, relay);
          if (createdAt >= since) {
            writeCheckpoint(pubkey, relay, createdAt + 1);
          }
        }
      }
    } catch {
      // Skip publish if encryption is unavailable
    }
  }

  return { published };
}
