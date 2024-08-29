import { type EventTemplate } from "nostr-tools";

export function createDeleteEvent(
  kinds: number[],
  eventIds: string[] = [],
  addresses: string[] = [],
  reason?: string,
) {
  const kTags = kinds.map((kind) => ["k", kind.toString()]);
  const eTags = eventIds.map((id) => ["e", id]);
  const aTags = addresses.map((address) => ["a", address]);
  const tags = [...kTags, ...eTags, ...aTags];

  const deleteEvent: EventTemplate = {
    kind: 5,
    created_at: Math.round(Date.now() / 1000),
    content: reason ?? "",
    tags,
  };

  return deleteEvent;
}
