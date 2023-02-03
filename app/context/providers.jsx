"use client";

import KeysProvider from "./keys-provider.jsx";
import BlogProvider from "./blog-provider.jsx";
import UserProvider from "./user-provider.jsx";
import { NostrProvider } from "nostr-react";
import { RELAYS } from "../lib/constants";
import NotifyProvider from "./notify-provider";

export default function Providers({ children }) {
  return (
    <NostrProvider relayUrls={RELAYS} debug={true}>
      <BlogProvider>
        <UserProvider>
          <NotifyProvider>
            <KeysProvider>{children}</KeysProvider>
          </NotifyProvider>
        </UserProvider>
      </BlogProvider>
    </NostrProvider>
  );
}
