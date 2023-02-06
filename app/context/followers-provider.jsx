"use client";

import { createContext, useState } from "react";

export const FollowersContext = createContext({});

export default function FollowersProvider({ children }) {
  const [followers, setFollowers] = useState({});

  return (
    <FollowersContext.Provider value={{ followers, setFollowers }}>
      {children}
    </FollowersContext.Provider>
  );
}
