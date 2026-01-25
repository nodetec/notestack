interface Window {
  nostr: Nostr;
}

interface Nip04 {
  encrypt(pubkey: string, plaintext: string): Promise<string>;
  decrypt(pubkey: string, ciphertext: string): Promise<string>;
}

interface Nip44 {
  encrypt(pubkey: string, plaintext: string): Promise<string>;
  decrypt(pubkey: string, ciphertext: string): Promise<string>;
}

// https://github.com/nostr-protocol/nips/blob/master/07.md
interface Nostr {
  getPublicKey(): Promise<string>;
  signEvent(event: unknown): Promise<unknown>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: Nip04;
  nip44?: Nip44;
}

declare const nostr: Nostr | undefined;
