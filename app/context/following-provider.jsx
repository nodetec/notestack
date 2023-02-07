"use client";

import { createContext, useState } from "react";

export const FollowingContext = createContext({});

export default function FollowingProvider({ children }) {
  const [following, setFollowing] = useState({});
  const [followingReload, setFollowingReload] = useState(false);

  return (
    <FollowingContext.Provider value={{ following, setFollowing, followingReload, setFollowingReload }}>
      {children}
    </FollowingContext.Provider>
  );
}
