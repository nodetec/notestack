// Nostr Init
import "websocket-polyfill";
import { relayInit, generatePrivateKey, getPublicKey } from "nostr-tools";
import type { Relay } from "nostr-tools";
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
  export async function connect(relayUrls: string[]) {
    let relays: any = [];

    for await (const relayUrl of relayUrls.map(async (relayUrl) => {
      const relay = relayInit(relayUrl);

      await relay.connect();

      console.log(relay);

      relay.on("connect", () => {
        console.log(`connected to ${relay.url}`);
        relays.push(relay);
      });

      relay.on("error", () => {
        console.log(`failed to connect to ${relay.url}`);
      });
    }))
      return relays;
  }

  export function genPrivateKey(): string {
    return generatePrivateKey();
  }

  export function genPublicKey(privateKey: string): string {
    return getPublicKey(privateKey);
  }

  export async function getProfile(publicKey: string, relay: Relay) {
    return new Promise<Event | null>((resolve) => {
      let sub = relay.sub([
        {
          kinds: [0],
          authors: [publicKey],
        },
      ]);
      sub.on("event", (event: Event) => {
        console.log("we got the event we wanted:", event);
        resolve(event);
      });
      sub.on("eose", () => {
        sub.unsub();
      });
    });
  }

  export async function getEvent(id: string, relay: Relay) {
    return new Promise<Event | null>((resolve) => {
      let sub = relay.sub([
        {
          ids: [id],
        },
      ]);
      sub.on("event", (event: Event) => {
        console.log("we got the event we wanted:", event);
        resolve(event);
      });
      sub.on("eose", () => {
        sub.unsub();
      });
    });
  }

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

  export async function addEventData(event: Event) {
    event.id = getEventHash(event);
    // @ts-ignore
    event = await window.nostr.signEvent(event);
    console.log("signed event", event);
    return event;
  }

  export function filterEvents(eventArray: Event[]) {
    const filteredEvents = eventArray.filter((e1, index) => {
      return eventArray.findIndex((e2) => e2.id === e1.id) === index;
    });
    return filteredEvents;
  }

  export function filterBlogEvents(eventObj: { [fieldName: string]: any }) {
    const eventArray = Object.values(eventObj).reduce(
      (acc, value) => acc.concat(value),
      []
    );

    const filteredEvents = eventArray.filter((e1: Event, index: number) => {
      if (e1.content === "") {
        return false;
      }
      const title = getTagValues("subject", e1.tags);
      if (!title || title === "") {
        return false;
      }
      return eventArray.findIndex((e2: Event) => e2.id === e1.id) === index;
    });
    return filteredEvents;
  }
}
