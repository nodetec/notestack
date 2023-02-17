"use client";

import { createContext, useState } from "react";

export const BlogContext = createContext({
  title: "",
  body: "",
  titleValid: true,
  bodyValid: true,
});

export default function BlogProvider({ children }) {
  const [blog, setBlog] = useState({
    title: "",
    body: "",
    titleValid: true,
    bodyValid: true,
  });

  return (
    <BlogContext.Provider value={{ blog, setBlog }}>
      {children}
    </BlogContext.Provider>
  );
}
