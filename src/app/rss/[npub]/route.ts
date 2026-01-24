import { nip19 } from 'nostr-tools';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { fetchProfiles } from '@/lib/nostr/profiles';
import { generateRSS, rssResponse } from '@/lib/rss';

const DEFAULT_RELAY = 'wss://relay.damus.io';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notestack.com';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ npub: string }> }
) {
  const { npub } = await params;

  // Decode npub to hex pubkey
  let pubkey: string;
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== 'npub') {
      return new Response('Invalid npub', { status: 400 });
    }
    pubkey = decoded.data;
  } catch {
    return new Response('Invalid npub format', { status: 400 });
  }

  // Fetch author's articles
  const { blogs } = await fetchBlogs({
    pubkey,
    limit: 50,
    relay: DEFAULT_RELAY,
  });

  // Fetch author profile
  const profiles = await fetchProfiles([pubkey]);
  const profile = profiles.get(pubkey);
  const authorName = profile?.name || npub.slice(0, 12) + '...';

  // Generate RSS
  const rss = generateRSS({
    title: `${authorName} on NoteStack`,
    description: `Articles by ${authorName}`,
    link: `${SITE_URL}/rss/${npub}`,
    blogs,
    profiles,
    relays: [DEFAULT_RELAY],
  });

  return rssResponse(rss);
}
