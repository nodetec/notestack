import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface State {
  relays: string[];
  setRelays: (relays: string[]) => void;
}

export const useAppState = create<State>()(
  persist(
    (set) => ({
      relays: ["wss://relay.notestack.com"],
      setRelays: (relays) => set({ relays }),
    }),
    {
      name: "notestack-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
