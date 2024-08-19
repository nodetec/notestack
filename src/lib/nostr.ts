import { type Profile, type RelayUrl } from "~/types";
import { nip19, type Event, type SimplePool } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";

export async function getPosts(pool: SimplePool, relays: RelayUrl[]) {
  const events = await pool.querySync(relays, { kinds: [30023], limit: 10 });
  return events;
}

export async function getProfile(
  pool: SimplePool,
  relays: string[],
  publicKey: string | undefined,
) {
  if (!publicKey) {
    return {} as Profile;
  }

  const profileEvent = await pool.get(relays, {
    kinds: [0],
    authors: [publicKey],
  });

  if (!profileEvent) {
    return {} as Profile;
  }

  return profileContent(profileEvent);
}

export const shortNpub = (pubkey: string | undefined, length = 4) => {
  if (!pubkey) {
    return undefined;
  }
  const npub = nip19.npubEncode(pubkey);
  return `npub...${npub.substring(npub.length - length)}`;
};

export function tag(key: string, event: Event | undefined) {
  if (!event) {
    return undefined;
  }
  const array = event.tags;
  if (!array) {
    return undefined;
  }
  const item = array.find((element) => element[0] === key);
  return item ? item[1] : undefined;
}

export function allTags(key: string, event: Event): string[] {
  return event.tags
    .filter(
      (innerArray) => innerArray[0] === key && innerArray[1] !== undefined,
    )
    .map((innerArray) => innerArray[1]!);
}

export const getTag = (name: string, tags: string[][]) => {
  const [itemTag] = tags.filter((tag: string[]) => tag[0] === name);
  const [, item] = itemTag ?? [, undefined];
  return item;
};

export const profileContent = (event: Event | undefined | null) => {
  try {
    return JSON.parse(event?.content ?? "{}") as Profile;
  } catch (err) {
    console.error("Error parsing profile content", err);
    return {} as Profile;
  }
};

// export const createNaddr = (
//   event: Event | undefined,
//   relays: RelayUrl[] | undefined = undefined
// ) => {
//   const identifier = tag("d", event);
//   if (!identifier) {
//     return null;
//   }
//   if (!event) {
//     return null;
//   }
//
//   const addressPointer: AddressPointer = {
//     identifier: identifier,
//     pubkey: event.pubkey,
//     kind: event.kind,
//     relays,
//   };
//
//   return nip19.naddrEncode(addressPointer);
// };

// export function createATag({ kind, pubkey, dTagValue }: ATagParams) {
//   return `${kind}:${pubkey}:${dTagValue}`;
// }

// function generateUniqueHash(data: string, length: number) {
//   const hash = sha256(utf8Encoder.encode(data));
//   return bytesToHex(hash).substring(0, length);
// }

// export async function finishEvent(
//   t: EventTemplate,
//   secretKey?: Uint8Array,
//   onErr?: (err: Error) => void
// ) {
//   let event = t as Event;
//   if (secretKey) {
//     return finalizeEvent(t, secretKey);
//   } else {
//     try {
//       if (nostr) {
//         event.pubkey = await nostr.getPublicKey();
//         event.id = getEventHash(event);
//         event = (await nostr.signEvent(event)) as Event;
//         console.log("signed event", event);
//         return event;
//       } else {
//         console.error("nostr not defined");
//         return undefined;
//       }
//     } catch (err) {
//       if (onErr) onErr(err as Error);
//       return undefined;
//     }
//   }
// }

// function createUrlSlug(title: string): string {
//   return title
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .replace(/\s+/g, "-");
// }

// export function createIdentifier(title: string, pubkey: string): string {
//   const titleSlug = createUrlSlug(title);
//   const uniqueHash = generateUniqueHash(title + pubkey, 12);
//   return `${titleSlug}-${uniqueHash}`;
// }

export function identityTag(
  platform: string,
  tags: (string | undefined)[][],
): (string | undefined)[] | undefined {
  return tags.find((tag) => tag[0] === "i" && tag[1]?.startsWith(platform));
}

export function makeNaddr(event: Event, relays: string[]) {
  const identifier = getTag("d", event.tags);
  if (!identifier) return;

  const addr: AddressPointer = {
    identifier,
    pubkey: event.pubkey,
    kind: event.kind,
    relays,
  };

  return nip19.naddrEncode(addr);
}
