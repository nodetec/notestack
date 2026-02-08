import { generateSecretKey } from 'nostr-tools';
import { bytesToHex, hexToBytes } from 'nostr-tools/utils';
import { BunkerSigner, parseBunkerInput } from 'nostr-tools/nip46';
import type { BunkerParams } from '@/types/auth';

let activeSigner: BunkerSigner | null = null;

export interface ConnectOptions {
  /** Called when the remote signer requires authorization via a URL (e.g. nsec.app). */
  onauth?: (url: string) => void;
}

/**
 * Connect to a remote signer via NIP-46.
 *
 * @param bunkerInput - A `bunker://` URL or `user@domain` NIP-05 identifier
 * @param options - Optional callbacks for the connection flow
 * @returns The user's public key and connection params for session persistence
 */
export async function connect(
  bunkerInput: string,
  options?: ConnectOptions,
): Promise<{ publicKey: string; bunkerParams: BunkerParams }> {
  // Clean up any existing connection
  await disconnect();

  const bp = await parseBunkerInput(bunkerInput);
  if (!bp) {
    throw new Error('Invalid bunker URL or NIP-05 address');
  }

  // Generate a disposable client keypair for this session
  const clientSecretKey = generateSecretKey();

  const signer = BunkerSigner.fromBunker(clientSecretKey, bp, {
    onauth: options?.onauth ?? ((url: string) => {
      // Default: open the auth URL in a new tab for user approval
      window.open(url, '_blank', 'noopener,noreferrer');
    }),
  });
  await signer.connect();

  const publicKey = await signer.getPublicKey();
  activeSigner = signer;

  return {
    publicKey,
    bunkerParams: {
      remotePubkey: bp.pubkey,
      relays: bp.relays,
      clientSecretKey: bytesToHex(clientSecretKey),
      secret: bp.secret,
    },
  };
}

/**
 * Restore a bunker connection from saved session params.
 * Called on page load when the user previously logged in with NIP-46.
 */
export async function restoreFromSession(
  bunkerParams: BunkerParams,
): Promise<void> {
  if (activeSigner) return; // already connected

  const clientSecretKey = hexToBytes(bunkerParams.clientSecretKey);
  const bp = {
    pubkey: bunkerParams.remotePubkey,
    relays: bunkerParams.relays,
    secret: bunkerParams.secret,
  };

  const signer = BunkerSigner.fromBunker(clientSecretKey, bp, {
    onauth: (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
  await signer.connect();
  activeSigner = signer;
}

/**
 * Get the active BunkerSigner instance, or null if not connected.
 */
export function getSigner(): BunkerSigner | null {
  return activeSigner;
}

/**
 * Disconnect from the remote signer and clean up.
 */
export async function disconnect(): Promise<void> {
  if (activeSigner) {
    try {
      await activeSigner.close();
    } catch {
      // Ignore close errors
    }
    activeSigner = null;
  }
}
