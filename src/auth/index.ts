// import { type TokenWithKeys, type UserWithKeys } from "~/types";

import { type TokenWithKeys, type UserWithKeys } from "~/types";
import { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "nostr",
      credentials: {
        publicKey: {
          label: "Public Key",
          type: "text",
          placeholder: "npub...",
        },
        secretKey: {
          label: "Secret Key",
          type: "text",
          placeholder: "nsec...",
        },
      },
      async authorize(credentials, _) {
        // no credentials
        if (!credentials) return null;

        // no publicKey and no secretKey
        if (!credentials?.publicKey && !credentials.secretKey) {
          return null;
        }

        // publicKey and no secretKey
        if (credentials.publicKey && !credentials.secretKey) {
          const user = {
            id: credentials.publicKey,
            publicKey: credentials.publicKey,
            secretKey: "",
          };
          return user;
        }

        // publicKey and secretKey
        if (credentials.publicKey && credentials.secretKey) {
          return {
            id: credentials.publicKey,
            publicKey: credentials.publicKey,
            secretKey: credentials.secretKey,
          };
        }

        // no publicKey and secretKey
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    // signOut: "/signout",
    error: "/error", // Error code passed in query string as ?error=
    // verifyRequest: "/auth/verify-request", // (used for check email message)
    newUser: "/register", // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // If the user object exists, it means this is the initial token creation.
      if (user) {
        token.publicKey = (user as UserWithKeys).publicKey;
        token.secretKey = (user as UserWithKeys).secretKey;
      }
      return token;
    },

    async session({ session, token }) {
      // Extract the publicKey from the JWT token and add it to the session object
      const user = session.user as UserWithKeys;
      user.publicKey = (token as TokenWithKeys).publicKey;
      user.secretKey = (token as TokenWithKeys).secretKey;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
