'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { $isTableCellNode, $isTableNode } from '@lexical/table';
import { $isCodeNode } from '@lexical/code';
import { $findMatchingParent } from '@lexical/utils';

/**
 * Plugin that allows breaking out of tables and code blocks by pressing
 * Shift+Enter. Inserts a new paragraph after the block and moves the
 * cursor there.
 */
export default function BlockBreakoutPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (!event?.shiftKey) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();

        // Check if we're inside a table cell
        const tableCellNode = $findMatchingParent(anchorNode, $isTableCellNode);
        if (tableCellNode) {
          const tableNode = $findMatchingParent(tableCellNode, $isTableNode);
          if (tableNode) {
            event.preventDefault();
            const paragraph = $createParagraphNode();
            tableNode.insertAfter(paragraph);
            paragraph.select();
            return true;
          }
        }

        // Check if we're inside a code block
        const codeNode = $findMatchingParent(anchorNode, $isCodeNode);
        if (codeNode) {
          event.preventDefault();
          const paragraph = $createParagraphNode();
          codeNode.insertAfter(paragraph);
          paragraph.select();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
