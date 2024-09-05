"use client";

import { useEffect } from "react";

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
  const initialConfig: InitialConfigType = {
    namespace: "NoteStackEditor",
    // theme: getTheme("dark"),
    editorState: () =>
      $convertFromMarkdownString(
        "# Don't write anything here yet!",
        TRANSFORMERS,
      ),
    nodes: [
      HorizontalRuleNode,
      //   // BannerNode,
      HeadingNode,
      // ImageNode,
      // QuoteNode,
      // CodeNode,
      // ListNode,
      // ListItemNode,
      // LinkNode,
      // AutoLinkNode,
    ],
    onError,
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="prose h-full w-full max-w-none overflow-auto border border-red-500 p-12 caret-foreground dark:prose-invert selection:bg-blue-300/25 focus:outline-none" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <OnChangePlugin onChange={onChange} />
        {/* <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> */}

        <HistoryPlugin />
        <MyCustomAutoFocusPlugin />
      </LexicalComposer>
    </div>
  );
}
