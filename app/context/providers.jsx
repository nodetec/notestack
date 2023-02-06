"use client";

import KeysProvider from "./keys-provider.jsx";
import RelayProvider from "./relay-provider.jsx";
import BlogProvider from "./blog-provider.jsx";
import UserProvider from "./user-provider.jsx";
import NotifyProvider from "./notify-provider";
import ProfilesProvider from "./profiles-provider";
import FeedProvider from "./feed-provider";
import FollowersProvider from "./followers-provider";
import FollowingProvider from "./following-provider";
import CachedEventProvider from "./cached-event-provider";

export default function Providers({ children }) {
  return (
    <RelayProvider>
      <BlogProvider>
        <UserProvider>
          <FollowingProvider>
            <FollowersProvider>
              <CachedEventProvider>
                <FeedProvider>
                  <ProfilesProvider>
                    <NotifyProvider>
                      <KeysProvider>{children}</KeysProvider>
                    </NotifyProvider>
                  </ProfilesProvider>
                </FeedProvider>
              </CachedEventProvider>
            </FollowersProvider>
          </FollowingProvider>
        </UserProvider>
      </BlogProvider>
    </RelayProvider>
  );
}
