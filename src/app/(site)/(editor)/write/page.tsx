"use client";

import React, { useEffect, useState } from "react";

import { CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import {
  LexicalComposer,
  type InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
// import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  $getRoot,
  $getSelection,
  LexicalEditor,
  type EditorState,
} from "lexical";
import { type Link, type Root } from "mdast";

import { ToolbarPlugin } from "./ToolbarPlugin";

import "./style.css";

// LexicalOnChangePlugin!
function onChange(editorState: EditorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    console.log("ROOT", root, selection);
  });
}

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: unknown) {
  console.error(error);
}

export default function Editor() {
  const [isClient, setIsClient] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const initialConfig: InitialConfigType = {
    namespace: "NoteStackEditor",
    // theme: getTheme("dark"),
    editorState: () =>
      $convertFromMarkdownString("# Start writing!", TRANSFORMERS),
    nodes: [
      HorizontalRuleNode,
      // BannerNode,
      HeadingNode,
      // ImageNode,
      QuoteNode,
      CodeNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
    ],
    onError,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-wrapper">
        <div className="editor-container">
          {/* Toolbar Toggle Button */}
          <button
            className="toolbar-toggle"
            onClick={() => setShowToolbar((prev) => !prev)}
          >
            {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
          </button>

          {/* Rich Text Editor */}
          <div className="editor-content">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={
                <div className="editor-placeholder">Enter some text...</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          {/* Toolbar Plugin */}
          {showToolbar && <ToolbarPlugin />}

          {/* Plugins */}
          <OnChangePlugin onChange={onChange} />
          {/* <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> */}

          <HistoryPlugin />
          <MyCustomAutoFocusPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
