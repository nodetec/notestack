import { NostrEvent, Blog, eventToBlog } from './types';

interface FetchBlogsOptions {
  limit?: number;
  until?: number;
  pubkey?: string;
  relay?: string;
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
