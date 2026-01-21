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
  publishedAt?: number;
  dTag: string;
  content: string;
  tags: string[];
  rawEvent?: NostrEvent; // Store full signed event for broadcasting
}

export function eventToBlog(event: NostrEvent): Blog {
  const getTag = (name: string) => event.tags.find((t) => t[0] === name)?.[1];
  // Extract all 't' tags (hashtags)
  const tags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);

  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    title: getTag('title') || 'Untitled',
    summary: getTag('summary'),
    image: getTag('image'),
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
  };
}
