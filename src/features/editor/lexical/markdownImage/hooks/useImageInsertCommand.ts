import { useEffect } from "react";

import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type LexicalEditor,
} from "lexical";

import {
  $createMarkdownImageNode,
  MarkdownImageNode,
} from "../nodes/MarkdownImageNode";

export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string;
  altText: string;
}> = createCommand("INSERT_IMAGE_COMMAND");

export function useImageInsertCommand(editor: LexicalEditor) {
  useEffect(() => {
    if (!editor.hasNodes([MarkdownImageNode])) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    return editor.registerCommand<{
      src: string;
      altText: string;
    }>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createMarkdownImageNode(payload);

        // Create a paragraph node after for better editing
        const paragraphAfter = $createParagraphNode();

        // Insert nodes at current selection
        $insertNodeToNearestRoot(imageNode);
        imageNode.insertAfter(paragraphAfter);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return editor;
}
