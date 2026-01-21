'use client';

import { create } from 'zustand';
import type { Stack, StackItem } from '@/lib/nostr/types';

interface StackState {
  stacks: Record<string, Stack>; // Keyed by dTag
  isLoading: boolean;

  // Actions
  setStacks: (stacks: Stack[]) => void;
  addStack: (stack: Stack) => void;
  updateStack: (dTag: string, updates: Partial<Stack>) => void;
  removeStack: (dTag: string) => void;

  // Item actions
  addItemToStack: (dTag: string, item: StackItem) => void;
  removeItemFromStack: (dTag: string, item: StackItem) => void;

  // Helpers
  getStacksContainingArticle: (pubkey: string, identifier: string) => Stack[];
  isArticleInStack: (dTag: string, pubkey: string, identifier: string) => boolean;
  isArticleInAnyStack: (pubkey: string, identifier: string) => boolean;

  // Loading state
  setLoading: (loading: boolean) => void;
}

export const useStackStore = create<StackState>()((set, get) => ({
  stacks: {},
  isLoading: false,

  setStacks: (stacks) => {
    const stacksRecord: Record<string, Stack> = {};
    for (const stack of stacks) {
      stacksRecord[stack.dTag] = stack;
    }
    set({ stacks: stacksRecord });
  },

  addStack: (stack) => {
    set((state) => ({
      stacks: {
        ...state.stacks,
        [stack.dTag]: stack,
      },
    }));
  },

  updateStack: (dTag, updates) => {
    set((state) => {
      const existing = state.stacks[dTag];
      if (!existing) return state;
      return {
        stacks: {
          ...state.stacks,
          [dTag]: { ...existing, ...updates },
        },
      };
    });
  },

  removeStack: (dTag) => {
    set((state) => {
      const { [dTag]: _removed, ...rest } = state.stacks;
      void _removed; // Intentionally unused - destructuring to exclude from rest
      return { stacks: rest };
    });
  },

  addItemToStack: (dTag, item) => {
    set((state) => {
      const stack = state.stacks[dTag];
      if (!stack) return state;

      // Check if item already exists
      const exists = stack.items.some(
        (i) => i.pubkey === item.pubkey && i.identifier === item.identifier
      );
      if (exists) return state;

      return {
        stacks: {
          ...state.stacks,
          [dTag]: {
            ...stack,
            items: [...stack.items, item],
          },
        },
      };
    });
  },

  removeItemFromStack: (dTag, item) => {
    set((state) => {
      const stack = state.stacks[dTag];
      if (!stack) return state;

      return {
        stacks: {
          ...state.stacks,
          [dTag]: {
            ...stack,
            items: stack.items.filter(
              (i) => !(i.pubkey === item.pubkey && i.identifier === item.identifier)
            ),
          },
        },
      };
    });
  },

  getStacksContainingArticle: (pubkey, identifier) => {
    const { stacks } = get();
    return Object.values(stacks).filter((stack) =>
      stack.items.some(
        (item) => item.pubkey === pubkey && item.identifier === identifier
      )
    );
  },

  isArticleInStack: (dTag, pubkey, identifier) => {
    const stack = get().stacks[dTag];
    if (!stack) return false;
    return stack.items.some(
      (item) => item.pubkey === pubkey && item.identifier === identifier
    );
  },

  isArticleInAnyStack: (pubkey, identifier) => {
    const { stacks } = get();
    return Object.values(stacks).some((stack) =>
      stack.items.some(
        (item) => item.pubkey === pubkey && item.identifier === identifier
      )
    );
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
