import NextAuth, { type DefaultSession, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// https://authjs.dev/getting-started/typescript#module-augmentation
declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      address: string;
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }

  interface User {
    address: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    session({ session, token, user }) {
      // `session.user.address` is now a valid property, and will be type-checked
      // in places like `useSession().data.user` or `auth().user`
      return {
        ...session,
        user: {
          ...session.user,
          address: user.address,
        },
      };
    },
  },

  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        // let user = null

        // logic to salt and hash password
        const pwHash = "pwhash";

        // logic to verify if the user exists
        // user = await getUserFromDb(credentials.email, pwHash)

        const user: User = {
          name: "user",
          email: "",
          address: "123 Fake St",
        };

        // if (!user) {
        //   // No user found, so this is their first attempt to login
        //   // meaning this is also the place you could do registration
        //   throw new Error("User not found.")
        // }

        // return user object with their profile data
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    // newUser: "/register",
    // error: /error
  },
});
