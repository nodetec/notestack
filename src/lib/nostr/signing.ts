import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { hexToBytes } from 'nostr-tools/utils';
import type { NostrEvent } from './types';
import { getSigner } from './bunkerManager';

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
  /** Optional secret key (hex) for local signing. If not provided, uses NIP-46 or NIP-07. */
  secretKey?: string;
}

/**
 * Sign an event using local secret key, NIP-46 remote signer, or NIP-07 extension.
 *
 * Priority:
 * 1. Local signing if secretKey is provided
 * 2. NIP-46 remote signing if a bunker signer is connected
 * 3. NIP-07 browser extension fallback
 *
 * @returns The signed event with id, pubkey, and sig
 */
export async function signEvent({ event, secretKey }: SignEventOptions): Promise<NostrEvent> {
  // Local signing with secret key
  if (secretKey) {
    const secretKeyBytes = hexToBytes(secretKey);
    const signedEvent = finalizeEvent(event, secretKeyBytes);
    return signedEvent as NostrEvent;
  }

  // NIP-46 remote signing (bunker)
  const bunkerSigner = getSigner();
  if (bunkerSigner) {
    const signedEvent = await bunkerSigner.signEvent(event);
    return signedEvent as NostrEvent;
  }

  // Fall back to NIP-07 extension
  if (!window.nostr) {
    throw new Error('No signing method available. Please sign in with an extension, nsec, or remote signer.');
  }

  const pubkey = await window.nostr.getPublicKey();
  const unsignedWithPubkey = { ...event, pubkey };
  const signedEvent = await window.nostr.signEvent(unsignedWithPubkey);
  return signedEvent as NostrEvent;
}

/**
 * Get the public key from either a secret key, NIP-46 signer, or NIP-07 extension.
 *
 * @param secretKey Optional secret key (hex).
 * @returns The public key (hex)
 */
export async function getSignerPublicKey(secretKey?: string): Promise<string> {
  if (secretKey) {
    const secretKeyBytes = hexToBytes(secretKey);
    return getPublicKey(secretKeyBytes);
  }

  const bunkerSigner = getSigner();
  if (bunkerSigner) {
    return bunkerSigner.getPublicKey();
  }

  if (!window.nostr) {
    throw new Error('No signing method available. Please sign in with an extension, nsec, or remote signer.');
  }

  return window.nostr.getPublicKey();
}
