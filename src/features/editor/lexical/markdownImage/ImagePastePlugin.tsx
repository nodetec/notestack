import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";

import { $createImageNode } from "./ImageNode";

const IMAGE_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)\)/;

export default function ImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removePasteOverride = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (!text) return false;

        const match = IMAGE_MARKDOWN_REGEX.exec(text);
        if (match) {
          const altText = match[1] ?? "";
          const url = match[2];

          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            if (!selection.isCollapsed()) {
              selection.removeText();
            }
            // TODO: fix url ""
            const imageNode = $createImageNode({ src: url ?? "", altText });
            selection.insertNodes([imageNode]);
          });
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      removePasteOverride();
    };
  }, [editor]);

  return null;
}
