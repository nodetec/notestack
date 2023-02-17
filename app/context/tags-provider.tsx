"use client";

import {
  createContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

export const TagsContext = createContext<{
  exploreTags: object;
  setExploreTags: Dispatch<SetStateAction<object>>;
}>({
  exploreTags: {},
  setExploreTags: () => {},
});

const TagsProvider = ({ children }: { children: ReactNode }) => {
  const [exploreTags, setExploreTags] = useState({});

  return (
    <TagsContext.Provider value={{ exploreTags, setExploreTags }}>
      {children}
    </TagsContext.Provider>
  );
};

export default TagsProvider;
