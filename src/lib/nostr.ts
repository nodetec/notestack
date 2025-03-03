import { getUser } from "~/server/auth";
import { finishEventWithSecretKey } from "~/server/nostr";
import {
  getEventHash,
  nip19,
  SimplePool,
  type Event,
  type EventTemplate,
  type Filter,
} from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";

import { DEFAULT_RELAYS, FEATURED_WRITERS } from "./constants";
import { type Profile } from "./events/profile-event";
import { normalizeUri } from "./utils";

function getFollowPubkeys(followEvent: Event | null | undefined) {
  if (!followEvent) {
    return [];
  }

  const followList = followEvent.tags
    .filter((tag) => tag[0] === "p" && typeof tag[1] !== "undefined")
    .map((tag) => tag[1]!);

  // // trim the follow list to 50
  if (followList.length > 50) {
    followList.length = 50;
  }

  return followList;
}

export async function getArticles(
  relays: string[],
  pageParam = 0,
  publicKey?: string,
  followEvent?: Event | null,
  feed?: string,
) {
  const pool = new SimplePool();

  let publicKeys: string[] | undefined = [
    ...FEATURED_WRITERS,
    ...getFollowPubkeys(followEvent),
  ];

  if (publicKey) {
    publicKeys = [publicKey];
  }

  if (followEvent && feed === "following") {
    publicKeys = getFollowPubkeys(followEvent);
  }

  let limit = 5;

  if (pageParam === 0) {
    limit = 10;
  }

  if (feed === "latest") {
    publicKeys = undefined;
  }

  // https://github.com/nbd-wtf/nostr-tools/issues/229
  // if we mix relays a relay with older data may be used and newer events will be ignored
  let events = await pool.querySync(
    relays,
    {
      kinds: [30023],
      limit,
      authors: publicKeys,
      until: pageParam === 0 ? undefined : pageParam - 1, // This assumes the API supports pagination by time or some other param
    },
    {
      id: "getArticles",
    },
  );
  pool.close(relays);

  if (!events) {
    return { articles: [], nextCursor: pageParam };
  }

  // slice events to limit
  events = events.slice(0, limit);

  // Sort the events by created_at in descending order
  events.sort((a, b) => b.created_at - a.created_at);

  // Determine if there's a next page by checking if we got more events than the limit
  // const hasNextPage = events.length > limit;

  // The cursor for the next page would be the creation time of the last event in the list
  let nextCursor = pageParam;
  if (events.length > 0) {
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      nextCursor = lastEvent.created_at;
    }
  }

  return {
    articles: events,
    nextCursor,
  };
}

export async function getEvent(filter: Filter, relays: string[]) {
  const pool = new SimplePool();
  const event = await pool.get(relays, filter);
  pool.close(relays);
  return event;
}

export async function getProfileEvents(relays: string[], publicKeys: string[]) {
  const pool = new SimplePool();

  const profileEvents = await pool.querySync(
    relays,
    {
      kinds: [0],
      authors: publicKeys,
    },
    {
      id: "getProfiles",
    },
  );

  pool.close(relays);

  return profileEvents;
}

export async function getProfileEvent(
  relays: string[],
  publicKey: string | undefined,
) {
  if (!publicKey) return null;

  const pool = new SimplePool();

  const profileEvent = await pool.get(relays, {
    kinds: [0],
    authors: [publicKey],
  });

  pool.close(relays);

  return profileEvent;
}

export async function getFollowEvent(
  relays: string[],
  publicKey: string | undefined,
) {
  if (!publicKey) {
    return null;
  }

  const pool = new SimplePool();

  const followEvent = await pool.get(relays, {
    kinds: [3],
    authors: [publicKey],
  });

  pool.close(relays);

  if (!followEvent) {
    return null;
  }

  return followEvent;
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

export function createEventAddress(
  kind: number,
  pubkey: string,
  dTagValue: string,
) {
  return `${kind}:${pubkey}:${dTagValue}`;
}

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

export function createProfileLink(
  profile: Profile | undefined | null,
  publicKey: string,
) {
  if (profile?.content?.nip05) {
    if (profile.content?.nip05.startsWith("_@")) {
      return `/${profile.content?.nip05.slice(2)}`;
    }
    return `/${profile.content?.nip05}`;
  }
  return `/${nip19.npubEncode(publicKey)}`;
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

export function createArticleLink(
  profile: Profile | undefined | null,
  articleEvent: Event,
  relays: string[],
) {
  if (profile?.content?.nip05) {
    if (profile.content?.nip05.startsWith("_@")) {
      return `/${profile.content?.nip05.slice(2)}/${getTag("d", articleEvent.tags)}`;
    }
    return `/${profile.content?.nip05}/${getTag("d", articleEvent.tags)}`;
  }
  return `/a/${makeNaddr(articleEvent, relays)}`;
}

export async function publish(eventTemplate: EventTemplate, relays: string[]) {
  let event;

  const user = await getUser();

  if (user?.secretKey === "0") {
    event = await finishEventWithExtension(eventTemplate);
  } else {
    if (user?.secretKey) {
      event = await finishEventWithSecretKey(eventTemplate);
    } else {
      console.error("User not found");
      return null;
    }
  }

  if (!event) {
    return null;
  }
  const pool = new SimplePool();

  await Promise.any(pool.publish(relays, event));

  const retrievedEvent = await pool.get(relays, {
    ids: [event.id],
  });
  pool.close(relays);

  if (!retrievedEvent) {
    return null;
  }

  return event;
}

export async function publishFinishedEvent(event: Event, relays: string[]) {
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

export async function broadcast(event: Event, relays: string[]) {
  if (!event) {
    return false;
  }
  const pool = new SimplePool();

  const result = await Promise.any(pool.publish(relays, event));

  pool.close(relays);

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
