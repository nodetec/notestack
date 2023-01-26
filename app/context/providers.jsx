"use client";

import KeysProvider from "./keys-provider.jsx";
import { NostrProvider } from "nostr-react";
import { RELAYS } from "../lib/constants";

export default function Providers({ children }) {
  return (
    <NostrProvider relayUrls={RELAYS} debug={false}>
      <KeysProvider>{children}</KeysProvider>
    </NostrProvider>
  );
}
