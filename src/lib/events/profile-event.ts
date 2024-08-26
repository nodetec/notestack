import { type Event } from "nostr-tools";

export interface ProfileContent {
  relay?: string;
  about?: string;
  lud06?: string;
  lud16?: string;
  name?: string;
  nip05?: string;
  picture?: string;
  website?: string;
  banner?: string;
  location?: string;
  github?: string;
  twitter?: string;
  [key: string]: unknown;
}

export interface Profile {
  event: Event;
  pubkey: string;
  content: ProfileContent;
}

export const parseProfileEvent = (event: Event) => {
  const profileEvent: Profile = {
    event,
    pubkey: event.pubkey,
    content: {},
  };
  try {
    const content = JSON.parse(event?.content ?? "{}") as ProfileContent;
    profileEvent.content = content;
    return profileEvent;
  } catch (err) {
    console.error("Error parsing profile content", err);
    return profileEvent;
  }
};
