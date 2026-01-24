import { fetchBlogs } from '@/lib/nostr/fetch';
import { fetchProfiles } from '@/lib/nostr/profiles';
import { generateRSS, rssResponse } from '@/lib/rss';

const DEFAULT_RELAY = 'wss://relay.damus.io';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notestack.com';

export async function GET() {
  // Fetch recent articles
  const { blogs } = await fetchBlogs({
    limit: 50,
    relay: DEFAULT_RELAY,
  });

  // Fetch profiles for all authors
  const pubkeys = [...new Set(blogs.map((b) => b.pubkey))];
  const profiles = await fetchProfiles(pubkeys);

  // Generate RSS
  const rss = generateRSS({
    title: 'NoteStack - Latest Articles',
    description: 'The latest long-form articles from the Nostr network',
    link: `${SITE_URL}/rss/feed`,
    blogs,
    profiles,
    relays: [DEFAULT_RELAY],
  });

  return rssResponse(rss);
}
