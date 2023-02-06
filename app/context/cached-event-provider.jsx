"use client";

import { createContext, useState } from "react";

export const CachedEventContext = createContext();

export default function CachedEventProvider({ children }) {
  const [cachedEvent, setCachedEvent] = useState();

  return (
    <CachedEventContext.Provider value={{ cachedEvent, setCachedEvent }}>
      {children}
    </CachedEventContext.Provider>
  );
}
