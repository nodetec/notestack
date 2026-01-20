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
