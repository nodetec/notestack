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
import { $findMatchingParent } from '@lexical/utils';

/**
 * Plugin that allows breaking out of a table by pressing Shift+Enter.
 * Inserts a new paragraph after the table and moves the cursor there.
 */
export default function TableBreakoutPlugin(): null {
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
        if (!tableCellNode) return false;

        // Find the parent table node
        const tableNode = $findMatchingParent(tableCellNode, $isTableNode);
        if (!tableNode) return false;

        event.preventDefault();

        // Insert a new paragraph after the table and select it
        const paragraph = $createParagraphNode();
        tableNode.insertAfter(paragraph);
        paragraph.select();

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  return null;
}
