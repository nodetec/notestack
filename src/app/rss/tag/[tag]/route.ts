import { fetchBlogs } from '@/lib/nostr/fetch';
import { fetchProfiles } from '@/lib/nostr/profiles';
import { generateRSS, rssResponse } from '@/lib/rss';

const DEFAULT_RELAY = 'wss://relay.damus.io';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notestack.com';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tag: string }> }
) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag).toLowerCase();

  // Fetch articles with this tag
  const { blogs } = await fetchBlogs({
    tag: decodedTag,
    limit: 50,
    relay: DEFAULT_RELAY,
  });

  // Fetch profiles for all authors
  const pubkeys = [...new Set(blogs.map((b) => b.pubkey))];
  const profiles = await fetchProfiles(pubkeys);

  // Generate RSS
  const rss = generateRSS({
    title: `#${decodedTag} on NoteStack`,
    description: `Articles tagged with #${decodedTag}`,
    link: `${SITE_URL}/rss/tag/${encodeURIComponent(decodedTag)}`,
    blogs,
    profiles,
    relays: [DEFAULT_RELAY],
  });

  return rssResponse(rss);
}
