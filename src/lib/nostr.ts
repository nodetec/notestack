import { finishEventWithSecretKey } from "~/server/nostr";
import { useAppState } from "~/store";
import { type Profile, type RelayUrl } from "~/types";
import {
  getEventHash,
  nip19,
  SimplePool,
  type Event,
  type EventTemplate,
} from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";

const relays = ["wss://relay.notestack.com"];

export async function getPosts(relays: RelayUrl[]) {
  const pool = new SimplePool();
  const events = await pool.querySync(relays, { kinds: [30023], limit: 10 });
  pool.close(relays);
  return events;
}

export async function getProfiles(
  relays: string[],
  publicKeys: string[] | undefined,
) {
  if (!publicKeys) {
    return [];
  }

  const pool = new SimplePool();

  const profileEvents = await pool.querySync(relays, {
    kinds: [0],
    authors: publicKeys,
  });

  pool.close(relays);

  if (!profileEvents) {
    return [];
  }

  return profileEvents.map(profileContent);
}

export async function getProfileEvent(
  relays: string[],
  publicKey: string | undefined,
) {
  if (!publicKey) return undefined;

  const pool = new SimplePool();

  const profileEvent = await pool.get(relays, {
    kinds: [0],
    authors: [publicKey],
  });

  pool.close(relays);

  if (!profileEvent) return undefined;

  return profileEvent;
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

export async function finishEventWithExtension(t: EventTemplate) {
  let event = t as Event;
  try {
    if (nostr) {
      event.pubkey = await nostr.getPublicKey();
      event.id = getEventHash(event);
      event = (await nostr.signEvent(event)) as Event;
      console.log("signed event", event);
      return event;
    } else {
      console.error("nostr not defined");
      return undefined;
    }
  } catch (err) {
    console.error("Error signing event", err);
    return undefined;
  }
}

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

export async function publish(eventTemplate: EventTemplate) {
  // TODO: get users publish relays
  const { relays } = useAppState.getState();

  let event;

  const publicKey = await nostr.getPublicKey();

  if (publicKey) {
    event = await finishEventWithExtension(eventTemplate);
  } else {
    event = await finishEventWithSecretKey(eventTemplate);
  }

  if (!event) {
    return false;
  }
  const pool = new SimplePool();

  await Promise.any(pool.publish(relays, event));


  const retrievedEvent = await pool.get(relays, {
    ids: [event.id],
  });
  pool.close(relays);

  if (!retrievedEvent) {
    return false;
  }

  return true;
}
