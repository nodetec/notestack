import { type Event } from "nostr-tools";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  articleMap: Map<string, Event>;
  addArticle: (id: string, article: Event) => void;
  clearArticles: () => void;

  markdown: string;
  setMarkdown: (markdown: string) => void;
}

export const useAppState = create<State>()(
  persist(
    (set, get) => ({
      articleMap: new Map(),
      addArticle: (id, article) =>
        set((state) => ({
          articleMap: new Map(state.articleMap.set(id, article)),
        })),
      clearArticles: () => set({ articleMap: new Map() }),

      markdown: "",
      setMarkdown: (markdown) => set({ markdown }),
    }),
    {
      name: "markdown-storage",
      partialize: (state) => ({ markdown: state.markdown }),
    },
  ),
);
