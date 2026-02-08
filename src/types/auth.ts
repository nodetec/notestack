import { type User } from 'next-auth';

export type SigningMethod = 'local' | 'nip07' | 'nip46';

export type BunkerParams = {
  /** Remote signer pubkey (hex) */
  remotePubkey: string;
  /** Relays for bunker communication */
  relays: string[];
  /** Disposable client secret key (hex), needed to re-establish sessions */
  clientSecretKey: string;
  /** Connection secret (single-use) */
  secret: string | null;
};

export type UserWithKeys = User & {
  secretKey: string;
  publicKey: string;
  signingMethod: SigningMethod;
  bunkerParams?: BunkerParams;
};

export type TokenWithKeys = {
  secretKey: string;
  publicKey: string;
  signingMethod: SigningMethod;
  bunkerParams?: BunkerParams;
};
