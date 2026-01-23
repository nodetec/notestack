import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { hexToBytes } from 'nostr-tools/utils';
import type { NostrEvent } from './types';

/**
 * Unsigned event template for signing
 */
export interface UnsignedEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

/**
 * Options for signing an event
 */
export interface SignEventOptions {
  /** The unsigned event to sign */
  event: UnsignedEvent;
  /** Optional secret key (hex) for local signing. If not provided, uses NIP-07 extension. */
  secretKey?: string;
}

/**
 * Sign an event using either a local secret key or NIP-07 extension.
 *
 * If secretKey is provided, signs locally using nostr-tools.
 * Otherwise, falls back to window.nostr.signEvent (NIP-07).
 *
 * @returns The signed event with id, pubkey, and sig
 */
export async function signEvent({ event, secretKey }: SignEventOptions): Promise<NostrEvent> {
  if (secretKey) {
    // Sign locally with the secret key
    const secretKeyBytes = hexToBytes(secretKey);
    const signedEvent = finalizeEvent(event, secretKeyBytes);
    return signedEvent as NostrEvent;
  }

  // Fall back to NIP-07 extension
  if (!window.nostr) {
    throw new Error('No Nostr extension found and no secret key provided');
  }

  const pubkey = await window.nostr.getPublicKey();
  const unsignedWithPubkey = { ...event, pubkey };
  const signedEvent = await window.nostr.signEvent(unsignedWithPubkey);
  return signedEvent as NostrEvent;
}

/**
 * Get the public key from either a secret key or NIP-07 extension.
 *
 * @param secretKey Optional secret key (hex). If not provided, uses NIP-07 extension.
 * @returns The public key (hex)
 */
export async function getSignerPublicKey(secretKey?: string): Promise<string> {
  if (secretKey) {
    const secretKeyBytes = hexToBytes(secretKey);
    return getPublicKey(secretKeyBytes);
  }

  if (!window.nostr) {
    throw new Error('No Nostr extension found and no secret key provided');
  }

  return window.nostr.getPublicKey();
}
