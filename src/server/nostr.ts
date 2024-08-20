"use server";

import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent, type Event, type EventTemplate } from "nostr-tools";

import { getUser } from "./auth";

export async function finishEventWithSecretKey(t: EventTemplate) {
  const user = await getUser();
  if (!user) {
    throw new Error("User not found");
  }

  const secretKey = hexToBytes(user.secretKey);

  return finalizeEvent(t, secretKey);
}

export async function publish(event: Event) {
  console.log("Publishing event", event);
}
