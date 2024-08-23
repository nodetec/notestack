import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface State {
  defaultReadRelay: string;
  setDefaultReadRelay: (defaultReadRelay: string) => void;

  // TODO: maybe let user have list of relays
  // relays: string[];
  // setRelays: (relays: string[]) => void;
}

export const useAppState = create<State>()(
  persist(
    (set) => ({
      defaultReadRelay: "wss://relay.notestack.com",
      setDefaultReadRelay: (defaultReadRelay) => set({ defaultReadRelay }),

      // relays: ["wss://relay.notestack.com"],
      // setRelays: (relays) => set({ relays }),
    }),
    {
      name: "notestack-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
