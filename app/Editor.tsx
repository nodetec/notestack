import { VALIDATION } from "./lib/constants";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import Button from "./Button";
import { Fragment, useContext, useRef, useState, useEffect } from "react";
import { AiFillEdit, AiFillEye } from "react-icons/ai";
import { RiLayoutColumnFill } from "react-icons/ri";
import { BlogContext } from "./context/blog-provider";
import { usePathname } from "next/navigation";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: true }
);

const Editor = ({}: any) => {
  const [mdPreviewMode, setMdPreviewMode] = useState<
    "off" | "preview" | "split"
  >("off");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [titleValid, setTitleValid] = useState(true);
  const [contentValid, setContentValid] = useState(true);

  const [titleFocused, setTitleFocused] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const [identifer, setIdentifier] = useState();

  // @ts-ignore
  const { blog, setBlog } = useContext(BlogContext);
  const pathname = usePathname();

  // useEffect(() => {
  //   setBlog({ ...blog, title: "", content: "", titleValid: true, contentValid: true });
  // }, [pathname]);

  useEffect(() => {
    setTitle(blog.title);
    setContent(blog.content);
    setIdentifier(blog.identifier);
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
  }, []);

  useEffect(() => {
    setTitleValid(blog.titleValid);
  }, [blog.titleValid]);

  useEffect(() => {
    setContentValid(blog.contentValid);
  }, [blog.contentValid]);

  const previewRef = useRef(null);

  const setupMarkdown = (content: string) => {
    const md = require("markdown-it")();
    const result = md.render(content || "");
    return result;
  };

  const scrollView = (e: any) => {
    /* @ts-ignore */
    previewRef.current?.scrollTo(
      0,
      (e.target.scrollTop / e.target.scrollTopMax) *
      /* @ts-ignore */
      previewRef.current.scrollTopMax
    );
  };

  const handleTitleFocus = () => {
    setTitleFocused(true);
  };

  const handleContentFocus = () => {
    setContentFocused(true);
  };

  const handleTitleChange = (evn: any) => {
    setTitle(evn.target.value);
    setTitleValid(true);
    setBlog({ ...blog, title: evn.target.value, titleValid: true });
  };

  const handleContentChange = (evn: any) => {
    setContent(evn.target.value);
    setContentValid(true);
    setBlog({ ...blog, content: evn.target.value, contentValid: true });
  };

  return (
    //state for mx-0
    <div className={`flex flex-col h-full ${mdPreviewMode === "split" ? "mx-0" : "lg:mx-80 md:mx-3"}`}>
      <div className="bg-secondary p-2 flex items-center justify-between">
        <div className="flex gap-2">
          <Fragment>
            <Button
              color="black"
              variant="ghost"
              className="hover:text-accent"
              title={mdPreviewMode === "off" ? "Preview" : "Edit"}
              onClick={() =>
                setMdPreviewMode(
                  mdPreviewMode === "preview" ? "off" : "preview"
                )
              }
              icon={
                mdPreviewMode === "preview" ? <AiFillEdit /> : <AiFillEye />
              }
            />
            <Button
              color="black"
              variant="ghost"
              title="Split Preview"
              className="hover:text-accent"
              onClick={() =>
                setMdPreviewMode(mdPreviewMode === "split" ? "off" : "split")
              }
              icon={
                <RiLayoutColumnFill
                  className={
                    mdPreviewMode === "split"
                      ? "rotate-[270deg] md:rotate-0"
                      : "rotate-90 md:rotate-180"
                  }
                />
              }
            />
          </Fragment>
        </div>
      </div>
        <div className="flex flex-col md:flex-row h-full overflow-auto">
          {mdPreviewMode !== "preview" && (
            <div className="flex flex-col w-full overflow-auto" onScroll={scrollView}>
              <div className="flex flex-col overflow-auto">
                <div className="mb-3">
                  <div style={{ height: "5.625rem" }}>
                    <textarea
                      title={title ?? ''}
                      required
                      rows={1}
                      className="text-black border-none focus:border-none resize-none text-4xl font-medium leading-normal px-6 pt-6 pb-0 w-full focus:ring-0 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-transparent outline-none"
                      style={{ height: "4.875rem" }}
                      value={title ?? ''}
                      placeholder="Title..."
                      onChange={handleTitleChange}
                      onBlur={handleTitleFocus}
                      /* @ts-ignore */
                      titlefocused={titleFocused.toString()}
                      titlevalid={titleValid !== undefined ? titleValid.toString() : true}
                    />
                    <span className="px-6 pt-0.5 text-xs text-red hidden">
                      {VALIDATION.required}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col overflow-auto">
                  <CodeEditor
                    required
                    className="w-full focus:border focus:border-blue-500 p-3 outline-none min-h-full"
                    value={content ?? ''}
                    language="markdown"
                    placeholder="Enter your note..."
                    autoCapitalize="none"
                    onChange={handleContentChange}
                    /* @ts-ignore */
                    onBlur={handleContentFocus}
                    /* @ts-ignore */
                    contentfocused={contentFocused.toString()}
                    contentvalid={contentValid !== undefined ? contentValid.toString() : true}
                    padding={24}
                    style={{
                      color: "#000",
                    }}
                  />
                  <span className="px-6 pt-0.5 text-xs text-red hidden">
                    {VALIDATION.required}
                  </span>
                </div>
              </div>
            </div>
          )}
          {mdPreviewMode !== "off" && (
            <div
              ref={previewRef}
              className={`flex flex-col w-full overflow-auto prose
                ${mdPreviewMode === "preview"
                  ? "min-w-full"
                  : mdPreviewMode === "split"
                    ? "border-t-2 md:border-l-2 md:border-t-0 border-secondary"
                    : ""
                }`}
            >
              <div className="mb-3">
                <div style={{ height: "5.625rem" }}>
                  <div className="overflow-auto">
                    <h1
                      className="pt-6 px-6 text-black text-4xl font-medium mb-0 leading-normal break-words"
                      style={{ height: "4.875rem" }}
                    >
                      {title}
                    </h1>
                  </div>
                </div>
              </div>
              <div
                className="h-full md-preview-note-wrapper overflow-auto text-black"
                dangerouslySetInnerHTML={{ __html: setupMarkdown(content) }}
              ></div>
            </div>
          )}
        </div>
    </div>
  );
};

export default Editor;
