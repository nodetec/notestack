import { SimplePool } from "nostr-tools/pool";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface State {
  pool: SimplePool;
  setPool: (pool: SimplePool) => void;
}

export const useAppState = create<State>()(
  persist(
    (set) => ({
      pool: new SimplePool(),
      setPool: (pool) => set({ pool }),
    }),
    {
      name: "captains-log-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
