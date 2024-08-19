import { type RelayUrl } from "~/types";
import { SimplePool } from "nostr-tools/pool";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface State {
  pool: SimplePool;
  setPool: (pool: SimplePool) => void;

  relays: RelayUrl[];
  setRelays: (relays: RelayUrl[]) => void;
}

export const useAppState = create<State>()(
  persist(
    (set) => ({
      pool: new SimplePool(),
      setPool: (pool) => set({ pool }),

      relays: ["wss://relay.notebook.com"],
      setRelays: (relays) => set({ relays }),
    }),
    {
      name: "notestack-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
