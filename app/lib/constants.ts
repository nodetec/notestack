export const RELAYS = [
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nostr.ch",
  "wss://relay.snort.social",
  // "wss://nostr.bitcoiner.social",
  // "wss://nostr.onsats.org",
  // "wss://nostr-relay.wlvs.space",
  // "wss://nostr.zebedee.cloud",
  // "wss://relay.damus.io",
  // "wss://relay.nostr.info",
];

export const HOST = "https://notebin.org";

export const DUMMY_PROFILE_API = (seed: string) => {
  const style:
    | "adventurer"
    | "adventurer-neutral"
    | "avataaars"
    | "avataaars-neutral"
    | "big-ears"
    | "big-ears-neutral"
    | "big-smile"
    | "bottts"
    | "bottts-neutral"
    | "croodles"
    | "croodles-neutral"
    | "fun-emoji"
    | "icons"
    | "identicon"
    | "initials"
    | "lorelei"
    | "lorelei-neutral"
    | "micah"
    | "miniavs"
    | "open-peeps"
    | "personas"
    | "pixel-art"
    | "pixel-art-neutral" = "identicon";
  return `https://api.dicebear.com/5.x/${style}/svg?seed=${seed}`;
};
