import "websocket-polyfill";
import sha256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";
import { getTagValues } from "./utils";

export enum Kind {
  Metadata = 0,
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Reaction = 7,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
}

export type Event = {
  id?: string;
  sig?: string;
  kind: Kind;
  tags: string[][];
  pubkey: string;
  content: string;
  created_at: number;
};

export namespace NostrService {
  export function createEvent(
    kind: number,
    publicKey: string,
    content: string,
    tags: string[][]
  ) {
    const event: Event = {
      kind: kind,
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      content: content,
      tags: tags,
    };
    event.id = getEventHash(event);

    return event;
  }

  function serializeEvent(evt: Event) {
    return JSON.stringify([
      0,
      evt.pubkey,
      evt.created_at,
      evt.kind,
      evt.tags,
      evt.content,
    ]);
  }

  function getEventHash(event: Event): string {
    return sha256(serializeEvent(event)).toString(Hex);
  }

  export async function signEvent(event: Event) {
    try {
      // @ts-ignore
      event = await window.nostr.signEvent(event);
    } catch (err: any) {
      console.error("signing event failed");
    }
    return event;
  }

  export function randomId() {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11)
      .replace(/[018]/g, (c: any) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      )
      .slice(0, 8);
  }

  export function filterBlogEvents(eventArray: Event[]) {
    const filteredEvents = eventArray.filter((e1: Event, index: number) => {
      if (e1.content === "") {
        return false;
      }
      const title = getTagValues("title", e1.tags);
      if (!title || title === "") {
        return false;
      }
      // return eventArray.findIndex((e2: Event) => e2.id === e1.id) === index;
      return true;
    });
    return filteredEvents;
  }
}
