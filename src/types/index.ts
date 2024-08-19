import { type User } from "next-auth";

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type UserWithKeys = User & {
  secretKey: string;
  publicKey: string;
};

export type RelayUrl = `wss://${string}`;

export interface Profile {
  relay?: string;
  publicKey?: string;
  about?: string;
  lud06?: string;
  lud16?: string;
  name?: string;
  nip05?: string;
  picture?: string;
  website?: string;
  banner?: string;
  location?: string;
  github?: string;
  twitter?: string;
  [key: string]: unknown;
}

export type TokenWithKeys = {
  secretKey: string;
  publicKey: string;
};
