import { type EditorThemeClasses } from "lexical";

import "./defaultTheme.css";

export const defaultTheme: EditorThemeClasses = {
  text: {
    // base: "font-sourceserif",
    bold: "bold",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    italic: "italic",
    code: "font-mono bg-muted text-muted-foreground rounded-md p-1",
    highlight: "bg-yellow-200",
    superscript: "text-xs",
  },
  code: "font-mono textCode bg-muted text-muted-foreground p-4 block overflow-x-auto relative",
  codeHighlight: {},
  heading: {
    h1: "text-3xl sm:text-[2.25rem] mb-2 mt-3 font-merriweather leading-[2.75rem]",
    h2: "text-2xl sm:text-3xl font-bold mb-2 mt-3 font-sans",
    h3: "text-xl sm:text-2xl font-bold mb-2 mt-3 font-sans",
    h4: "text-xl sm:text-2xl font-bold mb-2 mt-3 font-sans",
    h5: "text-xl sm:text-2xl font-bold mb-2 mt-3 font-sans",
    h6: "text-xl sm:text-2xl font-bold mb-2 mt-3 font-sans",
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
  link: "text-blue-500 underline cursor-pointer",
};
