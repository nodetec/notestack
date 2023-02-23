"use client";
import MdEditor from "react-markdown-editor-lite";
import { useContext, useEffect } from "react";
import { BlogContext } from "../context/blog-provider";
import "react-markdown-editor-lite/lib/index.css";

const WritePage = () => {
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content || "");
    return result;
  }

  // useEffect(() => {
  //   return () => {
  //     setBlog({
  //       title: "",
  //       summary: null,
  //       content: "",
  //       image: null,
  //       identifier: null,
  //       publishedAt: null,
  //       titleValid: true,
  //       contentValid: true,
  //     });
  //   };
  // }, [setBlog]);

  const handleTitleChange = (evn: any) => {
    setBlog({ ...blog, title: evn.target.value, titleValid: true });
  };

  const handleContentChange = (evn: any) => {
    setBlog({ ...blog, content: evn.text, contentValid: true });
  };

  return (
    <input
      className="w-full p-4 text-lg font-bold focus:outline-none"
      placeholder="Title..."
      style={{ backgroundColor: "#f5f5f5" }}
      value={blog.title}
      onChange={handleTitleChange}
    />
  );
};

export default WritePage;
