import { nip19, type Event } from "nostr-tools";
import { type AddressPointer } from "nostr-tools/nip19";

export const getTag = (name: string, tags: string[][]) => {
  const [itemTag] = tags.filter((tag: string[]) => tag[0] === name);
  const [, item] = itemTag ?? [, undefined];
  return item;
};

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
