import { useEffect } from "react";
import { type LexicalEditor, $getSelection, $isRangeSelection, COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from "lexical";
import { $createMarkdownImageNode } from "../nodes/MarkdownImageNode";

const IMAGE_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)\)/;

export function useMarkdownImagePaste(editor: LexicalEditor) {
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
            const imageNode = $createMarkdownImageNode({
              src: url ?? "",
              altText,
            });
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
}
