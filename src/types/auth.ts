import { type User } from 'next-auth';

export type UserWithKeys = User & {
  secretKey: string;
  publicKey: string;
};

export type TokenWithKeys = {
  secretKey: string;
  publicKey: string;
};
