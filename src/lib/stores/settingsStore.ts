'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

interface SettingsState {
  relays: string[];
  activeRelay: string;
  addRelay: (relay: string) => void;
  removeRelay: (relay: string) => void;
  setActiveRelay: (relay: string) => void;
  resetRelays: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      relays: DEFAULT_RELAYS,
      activeRelay: DEFAULT_RELAYS[0],
      addRelay: (relay) =>
        set((state) => ({
          relays: state.relays.includes(relay) ? state.relays : [...state.relays, relay],
        })),
      removeRelay: (relay) =>
        set((state) => {
          const newRelays = state.relays.filter((r) => r !== relay);
          // If removing the active relay, set active to first remaining relay
          const newActiveRelay = state.activeRelay === relay
            ? (newRelays[0] || '')
            : state.activeRelay;
          return { relays: newRelays, activeRelay: newActiveRelay };
        }),
      setActiveRelay: (relay) => set({ activeRelay: relay }),
      resetRelays: () => set({ relays: DEFAULT_RELAYS, activeRelay: DEFAULT_RELAYS[0] }),
    }),
    {
      name: 'ned-settings',
    }
  )
);

export { DEFAULT_RELAYS };
