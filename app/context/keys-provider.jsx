"use client";

import { createContext, useState } from "react";

export const KeysContext = createContext({
  privateKey: null,
  publicKey: null,
});

export default function KeysProvider({ children }) {
  const [keys, setKeys] = useState({
    privateKey: null,
    publicKey: null,
  });

  return (
    <KeysContext.Provider value={{ keys, setKeys }}>
      {children}
    </KeysContext.Provider>
  );
}
