import { stripCodeBlocks } from '@/lib/utils/markdown';

// NIP-01 Event structure
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

// NIP-84 Highlight (kind 9802)
export interface Highlight {
  id: string;
  pubkey: string;
  createdAt: number;
  content: string; // The highlighted text
  context?: string; // Surrounding text for context
  rawEvent?: NostrEvent; // Full event for debug/broadcast
  // Reference to the source (article)
  source: {
    kind: number;
    pubkey: string;
    identifier: string; // d-tag for addressable events
  };
  authorPubkey?: string; // Attribution to original author
}

// NIP-23 Long-form content (kind 30023)
export interface Blog {
  id: string;
  pubkey: string;
  createdAt: number;
  title: string;
  summary?: string;
  image?: string;
  audioUrl?: string;
  audioMime?: string;
  publishedAt?: number;
  dTag: string;
  content: string;
  tags: string[];
  rawEvent?: NostrEvent; // Store full signed event for broadcasting
  likeCount?: number;
  replyCount?: number;
  // Author profile info (optional, populated when selected from a panel)
  authorName?: string;
  authorPicture?: string;
}

export function eventToBlog(event: NostrEvent): Blog {
  const getTag = (name: string) => event.tags.find((t) => t[0] === name)?.[1];
  // Extract all 't' tags (hashtags)
  const tags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);
  const imetaTags = event.tags.filter((t) => t[0] === 'imeta');
  let audioUrl: string | undefined;
  let audioMime: string | undefined;

  for (const imeta of imetaTags) {
    const mime = imeta.find((part) => part.startsWith('m '))?.slice(2);
    const url = imeta.find((part) => part.startsWith('url '))?.slice(4);
    if (mime && mime.startsWith('audio/') && url) {
      audioMime = mime;
      audioUrl = url;
      break;
    }
  }
  if (!audioUrl) {
    const contentWithoutCode = stripCodeBlocks(event.content);
    const match = contentWithoutCode.match(/https?:\/\/\S+\.(mp3|wav|m4a|ogg|flac|aac)(\?\S*)?/i);
    if (match) {
      audioUrl = match[0];
    }
  }

  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    title: getTag('title') || 'Untitled',
    summary: getTag('summary'),
    image: getTag('image'),
    audioUrl,
    audioMime,
    publishedAt: getTag('published_at') ? parseInt(getTag('published_at')!) : undefined,
    dTag: getTag('d') || '',
    content: event.content,
    tags,
    rawEvent: event, // Include full signed event for broadcasting
  };
}

// NIP-51 Stack item (article reference)
export interface StackItem {
  kind: number; // 30023 for articles
  pubkey: string; // Article author pubkey
  identifier: string; // Article d-tag
  relay?: string; // Relay hint
}

// NIP-51 Bookmark Set (kind 30003)
export interface Stack {
  id: string; // Event ID
  pubkey: string; // Owner pubkey
  dTag: string; // Stack identifier (d tag)
  name: string; // Display name (title tag)
  description?: string;
  image?: string;
  createdAt: number;
  items: StackItem[];
  rawEvent?: NostrEvent; // Full event for broadcast/debug
}

export function eventToStack(event: NostrEvent): Stack {
  const getTag = (name: string) => event.tags.find((t) => t[0] === name)?.[1];

  // Parse 'a' tags to get stack items (article references)
  // Format: ["a", "30023:<pubkey>:<identifier>", "<relay>"]
  const items: StackItem[] = event.tags
    .filter((t) => t[0] === 'a')
    .reduce<StackItem[]>((acc, t) => {
      const parts = t[1]?.split(':');
      if (!parts || parts.length < 3) return acc;
      const [kindStr, pubkey, identifier] = parts;
      const kind = parseInt(kindStr, 10);
      if (isNaN(kind) || !pubkey || !identifier) return acc;
      acc.push({
        kind,
        pubkey,
        identifier,
        relay: t[2],
      });
      return acc;
    }, []);

  return {
    id: event.id,
    pubkey: event.pubkey,
    dTag: getTag('d') || '',
    name: getTag('title') || 'Untitled Stack',
    description: getTag('description'),
    image: getTag('image'),
    createdAt: event.created_at,
    items,
    rawEvent: event,
  };
}

export interface PinnedArticles {
  pubkey: string;
  createdAt: number;
  pinnedArticles: StackItem[];
  rawEvent?: NostrEvent;
}

export function eventToPinnedArticles(event: NostrEvent): PinnedArticles | null {
  if (event.kind !== 10001) return null;

  const pinnedArticles: StackItem[] = event.tags
    .filter((t) => t[0] === 'a')
    .reduce<StackItem[]>((acc, t) => {
      const parts = t[1]?.split(':');
      if (!parts || parts.length < 3) return acc;
      const [kindStr, pubkey, identifier] = parts;
      const kind = parseInt(kindStr, 10);
      if (isNaN(kind) || !pubkey || !identifier) return acc;
      if (kind === 30023) {
        acc.push({
          kind,
          pubkey,
          identifier,
          relay: t[2],
        });
      }
      return acc;
    }, []);

  return {
    pubkey: event.pubkey,
    createdAt: event.created_at,
    pinnedArticles,
    rawEvent: event,
  };
}

// NIP-22 Comment (kind 1111)
export interface Comment {
  id: string;
  pubkey: string;
  createdAt: number;
  content: string;
  // Root article reference (uppercase tags)
  root: {
    kind: number;
    pubkey: string;
    identifier: string;
    eventId?: string;
  };
  // Parent (article for top-level, comment for replies - lowercase tags)
  parent: {
    kind: number;
    pubkey: string;
    identifier?: string;
    eventId?: string;
  };
  // Parent comment ID if this is a reply to another comment
  replyTo?: string;
}

export function eventToComment(event: NostrEvent): Comment | null {
  if (event.kind !== 1111) return null;

  // Parse uppercase A tag (root scope - the article)
  const ATag = event.tags.find((t) => t[0] === 'A');
  if (!ATag || !ATag[1]) return null;

  const [rootKindStr, rootPubkey, rootIdentifier] = ATag[1].split(':');
  const rootKind = parseInt(rootKindStr, 10);
  if (!rootKind || !rootPubkey || !rootIdentifier) return null;

  // Parse uppercase E tag (root event ID)
  const ETag = event.tags.find((t) => t[0] === 'E');
  const rootEventId = ETag?.[1];

  // Parse lowercase a tag (parent - could be article or comment)
  const aTag = event.tags.find((t) => t[0] === 'a');
  let parentKind = rootKind;
  let parentPubkey = rootPubkey;
  let parentIdentifier: string | undefined = rootIdentifier;

  if (aTag && aTag[1]) {
    const [pKindStr, pPubkey, pIdentifier] = aTag[1].split(':');
    const pKind = parseInt(pKindStr, 10);
    if (pKind && pPubkey) {
      parentKind = pKind;
      parentPubkey = pPubkey;
      parentIdentifier = pIdentifier;
    }
  }

  // Parse lowercase e tag (parent event ID)
  const eTag = event.tags.find((t) => t[0] === 'e');
  const parentEventId = eTag?.[1];

  // If parent kind is 1111, this is a reply to another comment
  const replyTo = parentKind === 1111 ? parentEventId : undefined;

  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    content: event.content,
    root: {
      kind: rootKind,
      pubkey: rootPubkey,
      identifier: rootIdentifier,
      eventId: rootEventId,
    },
    parent: {
      kind: parentKind,
      pubkey: parentPubkey,
      identifier: parentIdentifier,
      eventId: parentEventId,
    },
    replyTo,
  };
}
