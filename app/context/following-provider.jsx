"use client";

import { createContext, useState } from "react";

export const FollowingContext = createContext({});

export default function FollowingProvider({ children }) {
  const [following, setFollowing] = useState({});

  return (
    <FollowingContext.Provider value={{ following, setFollowing }}>
      {children}
    </FollowingContext.Provider>
  );
}
