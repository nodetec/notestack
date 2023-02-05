"use client";

import { createContext, useState } from "react";

export const FeedContext = createContext({});

export default function FeedProvider({ children }) {
  const [feed, setFeed] = useState({});

  return (
    <FeedContext.Provider value={{ feed, setFeed }}>
      {children}
    </FeedContext.Provider>
  );
}
