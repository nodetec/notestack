import { nip19 } from 'nostr-tools';

const KIND_LONG_FORM = 30023;

export interface NaddrData {
  kind: number;
  pubkey: string;
  identifier: string;
  relays: string[];
}

export function blogToNaddr(
  blog: { pubkey: string; dTag: string },
  relays?: string[]
): string {
  return nip19.naddrEncode({
    kind: KIND_LONG_FORM,
    pubkey: blog.pubkey,
    identifier: blog.dTag,
    relays: relays?.slice(0, 2),
  });
}

export function decodeNaddr(naddr: string): NaddrData | null {
  try {
    const decoded = nip19.decode(naddr);
    if (decoded.type === 'naddr') {
      return decoded.data as NaddrData;
    }
    return null;
  } catch {
    return null;
  }
}
