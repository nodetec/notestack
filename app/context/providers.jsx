"use client";

import KeysProvider from "./keys-provider.jsx";
import BlogProvider from "./blog-provider.jsx";
import { NostrProvider } from "nostr-react";
import { RELAYS } from "../lib/constants";
import NotifyProvider from "./notify-provider";

export default function Providers({ children }) {
  return (
    <NostrProvider relayUrls={RELAYS} debug={false}>
      <BlogProvider>
        <NotifyProvider>
          <KeysProvider>{children}</KeysProvider>
        </NotifyProvider>
      </BlogProvider>
    </NostrProvider>
  );
}
