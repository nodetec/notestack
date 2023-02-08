"use client";

import { createContext, useState } from "react";

export const BlogContext = createContext({
  title: null,
  summary: null,
  content: null,
  image: null,
  identifier: null,
  createdAt: null,
});

export default function BlogProvider({ children }) {
  const [blog, setBlog] = useState({
    title: null,
    summary: null,
    content: null,
    image: null,
    identifier: null,
    createdAt: null,
  });

  return (
    <BlogContext.Provider value={{ blog, setBlog }}>
      {children}
    </BlogContext.Provider>
  );
}
