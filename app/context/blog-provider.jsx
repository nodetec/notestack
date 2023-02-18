"use client";

import { createContext, useState } from "react";

export const BlogContext = createContext({
  title: "",
  content: "",
  titleValid: true,
  contentValid: true,
  summary: null,
  image: null,
  identifier: null,
  publishedAt: null,
});

export default function BlogProvider({ children }) {
  const [blog, setBlog] = useState({
    title: "",
    content: "",
    titleValid: true,
    contentValid: true,
    summary: null,
    image: null,
    identifier: null,
    publishedAt: null,
  });

  return (
    <BlogContext.Provider value={{ blog, setBlog }}>
      {children}
    </BlogContext.Provider>
  );
}
