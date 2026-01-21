'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TagState {
  tags: string[];           // Saved tags (lowercase, no # prefix)
  activeTag: string | null; // Currently selected tag for filtering

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setActiveTag: (tag: string | null) => void;
}

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],
      activeTag: null,

      addTag: (tag) => {
        const normalized = tag.toLowerCase().trim().replace(/^#/, '');
        if (!normalized) return;
        set((state) => ({
          tags: state.tags.includes(normalized)
            ? state.tags
            : [...state.tags, normalized].sort(),
        }));
      },

      removeTag: (tag) => {
        const normalized = tag.toLowerCase().trim().replace(/^#/, '');
        set((state) => ({
          tags: state.tags.filter((t) => t !== normalized),
          activeTag: state.activeTag === normalized ? null : state.activeTag,
        }));
      },

      setActiveTag: (tag) => {
        const normalized = tag?.toLowerCase().trim().replace(/^#/, '') || null;
        set({ activeTag: normalized });
      },
    }),
    { name: 'ned-tags' }
  )
);
