"use client";

import KeysProvider from "./keys-provider.jsx";
import RelayProvider from "./relay-provider.jsx";
import BlogProvider from "./blog-provider.jsx";
import UserProvider from "./user-provider.jsx";
import NotifyProvider from "./notify-provider";
import ProfilesProvider from "./profiles-provider";

export default function Providers({ children }) {
  return (
    <RelayProvider>
      <BlogProvider>
        <UserProvider>
          <ProfilesProvider>
            <NotifyProvider>
              <KeysProvider>{children}</KeysProvider>
            </NotifyProvider>
          </ProfilesProvider>
        </UserProvider>
      </BlogProvider>
    </RelayProvider>
  );
}
