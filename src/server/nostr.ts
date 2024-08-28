"use server";

import { hexToBytes } from "@noble/hashes/utils";
import { notFound } from "next/navigation";
import { finalizeEvent, nip19, type EventTemplate } from "nostr-tools";
import { queryProfile } from "nostr-tools/nip05";

import { getUser } from "./auth";

export async function getPublicKeyAndRelayHintFromNip05OrNpub(profile: string) {
  profile = decodeURIComponent(profile);

  let profilePublicKey;
  let profileRelays;

  if (!profile) {
    console.error("Invalid profile", profile);
    notFound();
  }

  if (profile.startsWith("npub")) {
    try {
      const decodeResult = nip19.decode(profile);
      profilePublicKey = decodeResult.data as string;
    } catch (error) {
      console.error("Invalid npub", profile, error);
      notFound();
    }
  }

  if (!profilePublicKey) {
    const nip05Profile = await queryProfile(profile);
    profilePublicKey = nip05Profile?.pubkey;
    profileRelays = nip05Profile?.relays;
  }

  if (!profilePublicKey) {
    console.error("Invalid profile", profile);
    notFound();
  }

  return {
    publicKey: profilePublicKey,
    relays: profileRelays,
  };
}

// let newPool: SimplePool | null = null;

// const relays = ["wss://relay.notestack.com"];

// export async function getSimplePool() {
//   if (!newPool) {
//     newPool = new SimplePool();
//   }
//   return newPool;
// }

// // Usage
// const pool = getSimplePool();
//
// const pool = new SimplePool();

// console.log("pool", pool);

// console.log("list connection", pool.listConnectionStatus());

// export async function getPool() {
//   console.log("getPool");
//   return pool;
// }

// export async function getEvent(filter: Filter) {
//   const pool = new SimplePool();
//   const event = await pool.get(relays, filter);
//   pool.close(relays);
//   return event;
// }

// export async function getEvents(filter: Filter) {
//   const pool = new SimplePool();
//   const events = await pool.querySync(relays, filter);
//   pool.close(relays);
//   return events;
// }

export async function finishEventWithSecretKey(t: EventTemplate) {
  const user = await getUser();
  if (!user) {
    throw new Error("User not found");
  }

  const secretKey = hexToBytes(user.secretKey);

  return finalizeEvent(t, secretKey);
}
