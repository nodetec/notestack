import { type AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { type TokenWithKeys, type UserWithKeys, type BunkerParams } from '@/types/auth';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'nostr',
      credentials: {
        publicKey: {
          label: 'Public Key',
          type: 'text',
          placeholder: 'npub...',
        },
        secretKey: {
          label: 'Secret Key',
          type: 'text',
          placeholder: 'nsec...',
        },
        signingMethod: {
          label: 'Signing Method',
          type: 'text',
        },
        bunkerParams: {
          label: 'Bunker Params',
          type: 'text',
        },
      },
      async authorize(credentials) {
        // No credentials provided
        if (!credentials) return null;

        // No publicKey and no secretKey
        if (!credentials.publicKey && !credentials.secretKey) {
          return null;
        }

        const signingMethod = credentials.signingMethod || (credentials.secretKey ? 'local' : 'nip07');

        let bunkerParams: BunkerParams | undefined;
        if (credentials.bunkerParams) {
          try {
            bunkerParams = JSON.parse(credentials.bunkerParams);
          } catch {
            // Invalid bunker params
          }
        }

        // publicKey only (extension or bunker login)
        if (credentials.publicKey && !credentials.secretKey) {
          return {
            id: credentials.publicKey,
            publicKey: credentials.publicKey,
            secretKey: '',
            signingMethod,
            bunkerParams,
          };
        }

        // publicKey and secretKey (nsec login)
        if (credentials.publicKey && credentials.secretKey) {
          return {
            id: credentials.publicKey,
            publicKey: credentials.publicKey,
            secretKey: credentials.secretKey,
            signingMethod,
            bunkerParams,
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    newUser: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // If the user object exists, this is the initial token creation
      if (user) {
        token.publicKey = (user as UserWithKeys).publicKey;
        token.secretKey = (user as UserWithKeys).secretKey;
        token.signingMethod = (user as UserWithKeys).signingMethod;
        token.bunkerParams = (user as UserWithKeys).bunkerParams;
      }
      return token;
    },

    async session({ session, token }) {
      // Add the keys to the session object
      const user = session.user as UserWithKeys;
      user.publicKey = (token as TokenWithKeys).publicKey;
      user.secretKey = (token as TokenWithKeys).secretKey;
      user.signingMethod = (token as TokenWithKeys).signingMethod;
      user.bunkerParams = (token as TokenWithKeys).bunkerParams;
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
