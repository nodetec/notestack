import { NostrEvent, Blog, eventToBlog, Highlight, StackItem } from './types';

interface FetchBlogsOptions {
  limit?: number;
  until?: number;
  pubkey?: string;
  relay?: string;
  tag?: string;
}

function eventToHighlight(event: NostrEvent): Highlight | null {
  // Parse the 'a' tag to get source info
  const aTag = event.tags.find((t) => t[0] === 'a');
  if (!aTag || !aTag[1]) return null;

  const [kindStr, pubkey, identifier] = aTag[1].split(':');
  const kind = parseInt(kindStr, 10);
  if (!kind || !pubkey || !identifier) return null;

  // Get context if present
  const contextTag = event.tags.find((t) => t[0] === 'context');
  const context = contextTag?.[1];

  // Get author attribution
  const authorTag = event.tags.find((t) => t[0] === 'p' && t[3] === 'author');
  const authorPubkey = authorTag?.[1];

  return {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    content: event.content,
    context,
    rawEvent: event,
    source: { kind, pubkey, identifier },
    authorPubkey,
  };
}

export async function fetchBlogByAddress({
  pubkey,
  identifier,
  relay = 'wss://relay.damus.io',
}: {
  pubkey: string;
  identifier: string;
  relay?: string;
}): Promise<Blog | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const subId = `blog-addr-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    ws.onopen = () => {
      const filter = {
        kinds: [30023],
        authors: [pubkey],
        '#d': [identifier],
        limit: 1,
      };

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          resolve(null);
        }
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 30023 && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(eventToBlog(event));
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(null);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(null);
      }
    };
  });
}

export async function fetchBlogs({
  limit = 10,
  until,
  pubkey,
  relay = 'wss://relay.damus.io',
  tag,
}: FetchBlogsOptions = {}): Promise<{ blogs: Blog[]; nextCursor?: number }> {

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `blogs-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      const filter: Record<string, unknown> = {
        kinds: [30023],
        limit,
      };

      if (until) {
        filter.until = until;
      }

      if (pubkey) {
        filter.authors = [pubkey];
      }

      if (tag) {
        filter['#t'] = [tag.toLowerCase()];
      }

      ws.send(JSON.stringify(['REQ', subId, filter]));

      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        // Send CLOSE to unsubscribe before closing connection
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const blogs = events.map(eventToBlog);
        // Only set nextCursor if we got a full page (might be more), and subtract 1 to avoid duplicates
        const nextCursor = blogs.length >= limit ? Math.min(...blogs.map((b) => b.createdAt)) - 1 : undefined;
        resolve({ blogs, nextCursor });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          // Only accept kind 30023 (NIP-23 long-form content)
          if (event.kind === 30023) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          // Send CLOSE to unsubscribe before closing connection
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const blogs = events.map(eventToBlog);
          // Only set nextCursor if we got a full page (might be more), and subtract 1 to avoid duplicates
          const nextCursor = blogs.length >= limit ? Math.min(...blogs.map((b) => b.createdAt)) - 1 : undefined;
          resolve({ blogs, nextCursor });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
  });
}

// Fetch blogs for a list of addressable references (pubkey + d tag)
export async function fetchBlogsByAddresses({
  items,
  relay = 'wss://relay.damus.io',
}: {
  items: StackItem[];
  relay?: string;
}): Promise<(Blog | null)[]> {
  if (items.length === 0) return [];

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relay);
    const eventsByKey = new Map<string, NostrEvent>();
    const subId = `blogs-addr-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    const authors = Array.from(new Set(items.map((item) => item.pubkey)));
    const dTags = Array.from(new Set(items.map((item) => item.identifier)));

    ws.onopen = () => {
      const filter: Record<string, unknown> = {
        kinds: [30023],
        authors,
        '#d': dTags,
        limit: Math.max(items.length, 1),
      };

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const ordered = items.map((item) => {
          const key = `${item.pubkey}:${item.identifier}`;
          const event = eventsByKey.get(key);
          return event ? eventToBlog(event) : null;
        });
        resolve(ordered);
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 30023) {
            const dTag = event.tags.find((t) => t[0] === 'd')?.[1] || '';
            const key = `${event.pubkey}:${dTag}`;
            const existing = eventsByKey.get(key);
            if (!existing || event.created_at > existing.created_at) {
              eventsByKey.set(key, event);
            }
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const ordered = items.map((item) => {
            const key = `${item.pubkey}:${item.identifier}`;
            const event = eventsByKey.get(key);
            return event ? eventToBlog(event) : null;
          });
          resolve(ordered);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
  });
}

// Fetch user's highlights (for the highlights panel)
export async function fetchUserHighlights({
  pubkey,
  relay = 'wss://relay.damus.io',
  limit = 50,
  until,
}: {
  pubkey: string;
  relay?: string;
  limit?: number;
  until?: number;
}): Promise<{ highlights: Highlight[]; nextCursor?: number }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `user-highlights-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      const filter: Record<string, unknown> = {
        kinds: [9802],
        authors: [pubkey],
        limit,
      };

      if (until) {
        filter.until = until;
      }

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const highlights = events
          .map(eventToHighlight)
          .filter((h): h is Highlight => h !== null);
        const nextCursor = highlights.length >= limit
          ? Math.min(...highlights.map((h) => h.createdAt)) - 1
          : undefined;
        resolve({ highlights, nextCursor });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 9802) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const highlights = events
            .map(eventToHighlight)
            .filter((h): h is Highlight => h !== null);
          const nextCursor = highlights.length >= limit
            ? Math.min(...highlights.map((h) => h.createdAt)) - 1
            : undefined;
          resolve({ highlights, nextCursor });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      clearTimeout(timeoutId);
      resolve({ highlights: [] });
    };
  });
}

// Fetch NIP-84 highlights for an article

// Fetch user's full contact list event (kind 3) - returns the full event for modification
export async function fetchContactListEvent({
  pubkey,
  relay = 'wss://relay.damus.io',
}: {
  pubkey: string;
  relay?: string;
}): Promise<NostrEvent | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const subId = `contact-event-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subId, {
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      }]));

      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          resolve(null);
        }
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 3 && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve(null);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(null);
      }
    };
  });
}

// Fetch user's contacts (follow list) from kind 3 event (NIP-02)
export async function fetchContacts({
  pubkey,
  relay = 'wss://relay.damus.io',
}: {
  pubkey: string;
  relay?: string;
}): Promise<string[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const subId = `contacts-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;

    ws.onopen = () => {
      const filter = {
        kinds: [3],
        authors: [pubkey],
        limit: 1,
      };

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          resolve([]);
        }
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 3 && !resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            // Extract pubkeys from 'p' tags
            const followedPubkeys = event.tags
              .filter((t) => t[0] === 'p' && t[1])
              .map((t) => t[1]);
            resolve(followedPubkeys);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            ws.send(JSON.stringify(['CLOSE', subId]));
            ws.close();
            resolve([]);
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve([]);
      }
    };
  });
}

// Fetch user's interests/tags list (NIP-51 kind 10015)
export async function fetchInterestTags({
  pubkey,
  relay = 'wss://relay.damus.io',
}: {
  pubkey: string;
  relay?: string;
}): Promise<string[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const subId = `interest-tags-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    let latestEvent: NostrEvent | null = null;

    ws.onopen = () => {
      ws.send(JSON.stringify(['REQ', subId, {
        kinds: [10015],
        authors: [pubkey],
        limit: 10,
      }]));

      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const tags = latestEvent
          ? latestEvent.tags
              .filter((tag) => tag[0] === 't' && tag[1])
              .map((tag) => tag[1].toLowerCase())
          : [];
        resolve(Array.from(new Set(tags)).sort());
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind !== 10015) return;
          if (!latestEvent || event.created_at > latestEvent.created_at) {
            latestEvent = event;
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const tags = latestEvent
            ? latestEvent.tags
                .filter((tag) => tag[0] === 't' && tag[1])
                .map((tag) => tag[1].toLowerCase())
            : [];
          resolve(Array.from(new Set(tags)).sort());
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      resolve([]);
    };
  });
}

// Fetch blogs from multiple authors (for following feed)
export async function fetchFollowingBlogs({
  authors,
  limit = 10,
  until,
  relay = 'wss://relay.damus.io',
}: {
  authors: string[];
  limit?: number;
  until?: number;
  relay?: string;
}): Promise<{ blogs: Blog[]; nextCursor?: number }> {
  if (authors.length === 0) {
    return { blogs: [] };
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `following-blogs-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    ws.onopen = () => {
      const filter: Record<string, unknown> = {
        kinds: [30023],
        authors,
        limit,
      };

      if (until) {
        filter.until = until;
      }

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const blogs = events.map(eventToBlog);
        const nextCursor = blogs.length >= limit ? Math.min(...blogs.map((b) => b.createdAt)) - 1 : undefined;
        resolve({ blogs, nextCursor });
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 30023) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const blogs = events.map(eventToBlog);
          const nextCursor = blogs.length >= limit ? Math.min(...blogs.map((b) => b.createdAt)) - 1 : undefined;
          resolve({ blogs, nextCursor });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
  });
}

export async function fetchHighlights({
  articlePubkey,
  articleIdentifier,
  relay = 'wss://relay.damus.io',
  authors,
}: {
  articlePubkey: string;
  articleIdentifier: string;
  relay?: string;
  authors?: string[];
}): Promise<Highlight[]> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relay);
    const events: NostrEvent[] = [];
    const subId = `highlights-${Date.now()}`;
    let timeoutId: NodeJS.Timeout;

    // Build the 'a' tag value to search for
    const aTagValue = `30023:${articlePubkey}:${articleIdentifier}`;

    ws.onopen = () => {
      const filter: Record<string, unknown> = {
        kinds: [9802],
        '#a': [aTagValue],
        limit: 100,
      };

      if (authors && authors.length > 0) {
        filter.authors = authors;
      }

      ws.send(JSON.stringify(['REQ', subId, filter]));

      timeoutId = setTimeout(() => {
        ws.send(JSON.stringify(['CLOSE', subId]));
        ws.close();
        const highlights = events
          .map(eventToHighlight)
          .filter((h): h is Highlight => h !== null);
        resolve(highlights);
      }, 10000);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data[0] === 'EVENT' && data[1] === subId) {
          const event = data[2] as NostrEvent;
          if (event.kind === 9802) {
            events.push(event);
          }
        } else if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeoutId);
          ws.send(JSON.stringify(['CLOSE', subId]));
          ws.close();
          const highlights = events
            .map(eventToHighlight)
            .filter((h): h is Highlight => h !== null);
          resolve(highlights);
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
