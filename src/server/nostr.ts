"use server";

import { hexToBytes } from "@noble/hashes/utils";
import {
  finalizeEvent,
  SimplePool,
  type EventTemplate,
  type Filter,
} from "nostr-tools";

import { getUser } from "./auth";

// let newPool: SimplePool | null = null;

const relays = ["wss://relay.notestack.com"];

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

export async function getEvent(filter: Filter) {
  const pool = new SimplePool();
  const event = await pool.get(relays, filter);
  pool.close(relays);
  return event;
}

export async function getEvents(filter: Filter) {
  const pool = new SimplePool();
  const events = await pool.querySync(relays, filter);
  pool.close(relays);
  return events;
}

export async function finishEventWithSecretKey(t: EventTemplate) {
  const user = await getUser();
  if (!user) {
    throw new Error("User not found");
  }

  const secretKey = hexToBytes(user.secretKey);

  return finalizeEvent(t, secretKey);
}
