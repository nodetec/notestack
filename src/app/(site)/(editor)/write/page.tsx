"use client";

import { useEffect, useState } from "react";

import { Editor } from "nostr-edit";

import { editorTheme } from "./editor-theme";

export default function WritePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  function onChange(markdown: string) {}

  function onBlur(markdown: string) {}

  function onFocus(markdown: string) {}

  return (
    <div className="h-full cursor-text">
      <div className="mx-auto flex h-full max-w-xl flex-col pt-8">
        {isClient && (
          <Editor
            editorName="editor"
            initialMarkdown="# "
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            theme={editorTheme}
            // className="bg-red-500"
            // className="min-h-[calc(100vh-4rem)] flex-auto select-text flex-col pb-[50%] caret-sky-500/90 focus-visible:outline-none"
          />
        )}
      </div>
    </div>
  );
}
