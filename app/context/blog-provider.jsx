"use client";

import { createContext, useState } from "react";

export const BlogContext = createContext({
  title: null,
  body: null,
});

export default function BlogProvider({ children }) {
  const [blog, setBlog] = useState({
    title: null,
    body: null,
  });

  return (
    <BlogContext.Provider value={{ blog, setBlog }}>
      {children}
    </BlogContext.Provider>
  );
}
