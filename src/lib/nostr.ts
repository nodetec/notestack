// import { URL } from "url";

import { getUser } from "~/server/auth";
import { finishEventWithSecretKey } from "~/server/nostr";
import { type Profile, type RelayUrl } from "~/types";
import {
  getEventHash,
  nip19,
  SimplePool,
  type Event,
  type EventTemplate,
} from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";

import { DEFAULT_RELAYS } from "./constants";
import { normalizeUri } from "./utils";

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
  console.log("publicKeys", publicKeys);
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

  console.log("profileEvents", profileEvents);

  const profiles = profileEvents.map(profileContent);

  console.log("profiles form func", profiles);

  return profiles;
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
    const profile = JSON.parse(event?.content ?? "{}") as Profile;
    profile.pubkey = event?.pubkey;
    return profile;
  } catch (err) {
    console.error("Error parsing profile content", err);
    return {} as Profile;
  }
};

export async function getUserRelays(
  publicKey: string | undefined,
  relays: string[],
): Promise<{ url: string; read: boolean; write: boolean }[] | undefined> {
  if (!publicKey) {
    return undefined;
  }

  const pool = new SimplePool();

  const relayEvent = await pool.get(relays, {
    kinds: [10002],
    authors: [publicKey],
  });

  pool.close(relays);

  if (!relayEvent) {
    return undefined;
  }

  // Parse the tags to construct the desired array of objects
  const result = relayEvent.tags.map((tag: string[]) => {
    const [_, url, marker] = tag;
    return {
      url: url ?? "",
      read: marker !== "write",
      write: marker !== "read",
    };
  });

  return result;
}

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

export async function publish(eventTemplate: EventTemplate, relays: string[]) {
  let event;

  const user = await getUser();

  if (user?.secretKey) {
    event = await finishEventWithSecretKey(eventTemplate);
  } else {
    event = await finishEventWithExtension(eventTemplate);
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

export async function publishUserRelays(
  readRelays: string[],
  writeRelays: string[],
) {
  // Initialize an empty array to hold the tags
  const tags: string[][] = [];

  // Create a Set of normalized write relays for quick lookup
  const writeRelaysSet = new Set(writeRelays.map(normalizeUri));

  // Create a Set to hold all unique normalized relays
  const allRelaysSet = new Set<string>();

  // Add relays from the readRelays array
  readRelays.forEach((relay) => {
    const normalizedRelay = normalizeUri(relay);
    allRelaysSet.add(normalizedRelay); // Add to the set of all relays

    if (writeRelaysSet.has(normalizedRelay)) {
      // If the relay is in both read and write relays, add it with no marker
      tags.push(["r", normalizedRelay]);
      // Remove it from the writeRelaysSet to avoid adding it again later
      writeRelaysSet.delete(normalizedRelay);
    } else {
      // Otherwise, add it with the "read" marker
      tags.push(["r", normalizedRelay, "read"]);
    }
  });

  // Add remaining write relays that weren't in read relays
  writeRelaysSet.forEach((relay) => {
    allRelaysSet.add(relay); // Add to the set of all relays
    tags.push(["r", relay, "write"]);
  });

  // Merge normalized DEFAULT_RELAYS with allRelaysSet, ensuring all values are unique
  DEFAULT_RELAYS.forEach((relay) => {
    allRelaysSet.add(normalizeUri(relay));
  });

  // Convert the set of all unique normalized relays to an array
  const allRelaysArray = Array.from(allRelaysSet);

  // Construct the final object
  const eventTemplate: EventTemplate = {
    kind: 10002,
    tags: tags,
    content: "",
    created_at: Math.floor(Date.now() / 1000),
  };

  // Pass the unique normalized relays to the publish function
  const result = await publish(eventTemplate, allRelaysArray);

  return result;
}
