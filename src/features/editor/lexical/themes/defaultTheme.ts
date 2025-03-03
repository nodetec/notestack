import { type EditorThemeClasses } from "lexical";

import "./defaultTheme.css";

export const defaultTheme: EditorThemeClasses = {
  text: {
    bold: "bold",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    italic: "italic",
    code: "font-mono bg-muted text-muted-foreground rounded-md p-1",
    highlight: "bg-yellow-200",
    superscript: "text-xs",
  },
  code: "font-mono textCode bg-muted text-gray-800 p-4 block overflow-x-auto relative",
  codeHighlight: {},
  heading: {
    h1: "text-4xl font-bold mb-2 mt-3",
    h2: "text-3xl font-bold mb-2 mt-3",
    h3: "text-2xl font-bold mb-2 mt-3",
    h4: "text-xl font-bold mb-2 mt-3",
    h5: "text-lg font-bold mb-2 mt-3",
    h6: "text-lg font-bold mb-2 mt-3",
  },
  list: {
    olDepth: [
      "list-decimal ml-4",
      "list-decimal ml-8",
      "list-decimal ml-12",
      "list-decimal ml-16",
      "list-decimal ml-20",
    ],
    ul: "list-disc ml-4 list-inside",
    ol: "list-decimal ml-4 list-inside",
  },
  embedBlock: {
    base: "p-4",
    focus: "ring-2 ring-blue-500 rounded-md",
  },
  image: "editor-image",
  inlineImage: "inline-editor-image",
};
