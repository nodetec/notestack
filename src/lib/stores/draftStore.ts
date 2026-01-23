'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

export interface LinkedBlog {
  pubkey: string;
  dTag: string;
  // Metadata from original blog for pre-filling publish dialog
  title?: string;
  summary?: string;
  image?: string;
  tags?: string[];
}

export interface Draft {
  id: string;
  content: string;
  lastSaved: number;
  linkedBlog?: LinkedBlog;
  isMarkdownMode?: boolean;
}

interface DraftState {
  drafts: Record<string, Draft>;
  saveStatus: SaveStatus;

  getDraft: (id: string) => Draft | undefined;
  setDraftContent: (id: string, content: string) => void;
  setDraftMarkdownMode: (id: string, isMarkdownMode: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  markSaved: (id: string) => void;
  deleteDraft: (id: string) => void;
  createDraft: () => string;
  createDraftFromBlog: (content: string, linkedBlog: LinkedBlog) => string;
  findDraftByLinkedBlog: (pubkey: string, dTag: string) => Draft | undefined;
}

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      saveStatus: 'idle',

      getDraft: (id) => get().drafts[id],

      setDraftContent: (id, content) => set((state) => ({
        drafts: {
          ...state.drafts,
          [id]: {
            ...state.drafts[id],
            id,
            content,
            lastSaved: state.drafts[id]?.lastSaved ?? Date.now(),
          },
        },
        // Don't change saveStatus here - let the caller control it
      })),

      setDraftMarkdownMode: (id, isMarkdownMode) => set((state) => {
        if (!state.drafts[id]) return state;
        return {
          drafts: {
            ...state.drafts,
            [id]: {
              ...state.drafts[id],
              isMarkdownMode,
            },
          },
        };
      }),

      setSaveStatus: (status) => set({ saveStatus: status }),

      markSaved: (id) => set((state) => ({
        drafts: {
          ...state.drafts,
          [id]: {
            ...state.drafts[id],
            id,
            lastSaved: Date.now(),
          },
        },
        saveStatus: 'saved',
      })),

      deleteDraft: (id) => set((state) => {
        const { [id]: _, ...rest } = state.drafts;
        return { drafts: rest, saveStatus: 'idle' };
      }),

      createDraft: () => {
        const id = generateId();
        set((state) => ({
          drafts: {
            ...state.drafts,
            [id]: {
              id,
              content: '',
              lastSaved: Date.now(),
            },
          },
        }));
        return id;
      },

      createDraftFromBlog: (content: string, linkedBlog: LinkedBlog) => {
        const id = generateId();
        set((state) => ({
          drafts: {
            ...state.drafts,
            [id]: {
              id,
              content,
              lastSaved: Date.now(),
              linkedBlog,
            },
          },
        }));
        return id;
      },

      findDraftByLinkedBlog: (pubkey: string, dTag: string) => {
        const drafts = get().drafts;
        return Object.values(drafts).find(
          (draft) => draft.linkedBlog?.pubkey === pubkey && draft.linkedBlog?.dTag === dTag
        );
      },
    }),
    {
      name: 'ned-drafts',
      partialize: (state) => ({
        drafts: state.drafts,
      }),
    }
  )
);
