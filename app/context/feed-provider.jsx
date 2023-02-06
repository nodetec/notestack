"use client";

import { createContext, useState } from "react";

export const FeedContext = createContext({});

export default function FeedProvider({ children }) {
  const [feed, setFeed] = useState({});
  const [latestFeedDone, setLatestFeedDone] = useState(false);

  return (
    <FeedContext.Provider value={{ feed, setFeed, latestFeedDone, setLatestFeedDone }}>
      {children}
    </FeedContext.Provider>
  );
}
