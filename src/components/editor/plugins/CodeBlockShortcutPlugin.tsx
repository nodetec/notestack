'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  $createParagraphNode,
} from 'lexical';
import { $createCodeNode, $isCodeNode } from '@lexical/code';

export default function CodeBlockShortcutPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const textContent = anchorNode.getTextContent();

        // Check if the line starts with ```
        if (textContent.startsWith('```')) {
          event?.preventDefault();

          const language = textContent.slice(3).trim() || undefined;
          const parent = anchorNode.getParent();

          // Create a code node
          const codeNode = $createCodeNode(language);

          // Replace the current paragraph with the code node
          if (parent) {
            parent.replace(codeNode);
            codeNode.select();
          }

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
