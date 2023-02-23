"use client";
import MdEditor from "react-markdown-editor-lite";
// import "@uiw/react-markdown-editor/markdown-editor.css";
// import "@uiw/react-markdown-preview/markdown.css";
import { useContext, useEffect } from "react";
import { BlogContext } from "../context/blog-provider";
// import MarkdownIt from 'markdown-it';
import "react-markdown-editor-lite/lib/index.css";

const WritePage = () => {
  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);

  function setupMarkdown(content: string) {
    var md = require("markdown-it")();
    var result = md.render(content || "");
    return result;
  }

  useEffect(() => {
    return () => {
      setBlog({
        title: "",
        summary: null,
        content: "",
        image: null,
        identifier: null,
        publishedAt: null,
        titleValid: true,
        contentValid: true,
      });
    };
  }, [setBlog]);

  const handleTitleChange = (evn: any) => {
    setBlog({ ...blog, title: evn.target.value, titleValid: true });
  };

  const handleContentChange = (evn: any) => {
    setBlog({ ...blog, content: evn.text, contentValid: true });
  };

  return (
    <div className="mt-8 shadow-editor rounded-md overflow-hidden">
      <input
        className="w-full p-4 text-lg font-bold focus:outline-none"
        placeholder="Title..."
        style={{ backgroundColor: "#f6f8fa" }}
        value={blog.title}
        onChange={handleTitleChange}
      />
      <div>
        <MdEditor
          className="h-[75vh]"
          value={blog.content}
          renderHTML={(text) => setupMarkdown(text)}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
};

export default WritePage;
