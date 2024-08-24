import { type Event } from "nostr-tools";
import { create } from "zustand";

interface State {
  articleMap: Map<string, Event>;
  addArticle: (id: string, article: Event) => void;
  clearArticles: () => void;
}

export const useAppState = create<State>()((set) => ({
  articleMap: new Map(),
  addArticle: (id, article) =>
    set((state) => ({
      articleMap: new Map(state.articleMap.set(id, article)),
    })),
  clearArticles: () => set({ articleMap: new Map() }),
}));
