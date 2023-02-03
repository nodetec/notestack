"use client";

import KeysProvider from "./keys-provider.jsx";
import RelayProvider from "./relay-provider.jsx";
import BlogProvider from "./blog-provider.jsx";
import UserProvider from "./user-provider.jsx";
import NotifyProvider from "./notify-provider";

export default function Providers({ children }) {
  return (
    <RelayProvider>
      <BlogProvider>
        <UserProvider>
          <NotifyProvider>
            <KeysProvider>{children}</KeysProvider>
          </NotifyProvider>
        </UserProvider>
      </BlogProvider>
    </RelayProvider>
  );
}
