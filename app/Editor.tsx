// import { VALIDATION } from "./utils/constants";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import Button from "./Button";
import { Fragment, useRef, useState } from "react";
import { AiFillEdit, AiFillEye } from "react-icons/ai";
import { RiLayoutColumnFill } from "react-icons/ri";
// import CreatePostButton from "./CreatePostButton";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: true }
);

const Editor = ({
  //   text,
  //   setText,
  //   title,
  //   setTitle,
}: any) => {
  const [mdPreviewMode, setMdPreviewMode] = useState<
    "off" | "preview" | "split"
  >("off");

  const [titleFocused, setTitleFocused] = useState(false);
  const [textFocused, setTextFocused] = useState(false);

  const [titleValid, setTitleValid] = useState(true);
  const [textValid, setTextValid] = useState(true);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const previewRef = useRef(null);

  const setupMarkdown = (text: string) => {
    const md = require("markdown-it")();
    const result = md.render(text);
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

  const handleTextFocus = () => {
    setTextFocused(true);
  };

  const onPostSubmit = (validations: { title: boolean; text: boolean }) => {
    setTitleValid(validations.title);
    setTextValid(validations.text);
  };

  return (
    //state for mx-0
    <div className={`h-full ${mdPreviewMode === "split" ? "mx-0" : "mx-80"}`}>
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
      <div className="flex flex-col md:flex-row h-[calc(100vh-34px)]">
        {mdPreviewMode !== "preview" && (
          <div className="flex flex-col w-full h-full " onScroll={scrollView}>
            <div className="flex flex-col grow min-h-full">
              <div>
                <textarea
                  title={title}
                  required
                  rows={1}
                  className="text-black border-none focus:border-none resize-none font-medium text-4xl px-6 pt-6 pb-0 w-full 
                  focus:ring-0 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-transparent overflow-hidden"
                  value={title}
                  placeholder="Title..."
                  onChange={(evn) => {
                    setTitle(evn.target.value);
                    setTitleValid(true);
                  }}
                  onBlur={handleTitleFocus}
                  /* @ts-ignore */
                  titlefocused={titleFocused.toString()}
                  titlevalid={titleValid.toString()}
                />
                {/* <span className="px-6 pt-0.5 text-xs text-red-500 hidden">
                  {VALIDATION.required}
                </span> */}
              </div>
              <div className="flex flex-col grow">
                <CodeEditor
                  required
                  className="w-full focus:border focus:border-blue-500 p-3 outline-none min-h-full"
                  value={text}
                  language="markdown"
                  placeholder="Enter your note..."
                  autoCapitalize="none"
                  onChange={(evn) => {
                    setText(evn.target.value);
                    setTextValid(true);
                  }}
                  onBlur={handleTextFocus}
                  /* @ts-ignore */
                  textfocused={textFocused.toString()}
                  textvalid={textValid.toString()}
                  padding={24}
                  style={{
                    color: "#000",
                  }}
                />
                {/* <span className="px-6 pt-0.5 pb-6 text-xs text-red-500 hidden">
                    {VALIDATION.required}
                </span> */}
              </div>
            </div>
          </div>
        )}
        {mdPreviewMode !== "off" && (
          <div
            ref={previewRef}
            className={`w-full h-full prose
                ${
                  mdPreviewMode === "preview"
                    ? "min-w-full"
                    : mdPreviewMode === "split"
                    ? "border-t-2 md:border-l-2 md:border-t-0 border-secondary pl-7"
                    : ""
                }`}
          >
            <h1
              className="text-black text-5xl font-medium py-6"
              style={{ paddingBottom: "0.375rem" }}
            >
              {title}
            </h1>
            <div
              className="md-preview-note-wrapper text-black"
              dangerouslySetInnerHTML={{ __html: setupMarkdown(text) }}
            ></div>
          </div>
        )}
      </div>
      {/* <div className="rounded-b-md border-x-2 border-b-2 border-secondary p-1 pt-2 -mt-1 flex items-center justify-between gap-4">
        <CreatePostButton
          filetype="markdown"
          text={text}
          title={title}
          tagsList={tagsList}
          onSubmit={onPostSubmit}
        />
      </div> */}
    </div>
  );
};

export default Editor;
