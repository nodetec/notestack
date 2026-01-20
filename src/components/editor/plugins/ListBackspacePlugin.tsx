'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
} from 'lexical';
import { $isListItemNode } from '@lexical/list';

export default function ListBackspacePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Check if cursor is at the start of a text node
        if (anchorOffset !== 0) {
          return false;
        }

        // Find the list item parent
        let listItemNode = anchorNode.getParent();

        // If anchorNode is directly a ListItemNode (empty list item)
        if ($isListItemNode(anchorNode)) {
          listItemNode = anchorNode;
        }

        // Walk up to find list item
        while (listItemNode && !$isListItemNode(listItemNode)) {
          listItemNode = listItemNode.getParent();
        }

        if (!$isListItemNode(listItemNode)) {
          return false;
        }

        // Check if cursor is at the start of the first child
        const topElement = anchorNode.getTopLevelElementOrThrow();
        if (topElement !== listItemNode) {
          return false;
        }

        // Get current indent level
        const currentIndent = listItemNode.getIndent();

        // If nested, outdent instead of converting to paragraph
        if (currentIndent > 0) {
          event?.preventDefault();
          listItemNode.setIndent(currentIndent - 1);
          return true;
        }

        // At root level - check if empty or convert to paragraph
        const firstChild = listItemNode.getFirstChild();
        if (!firstChild) {
          // Empty list item - convert to paragraph
          event?.preventDefault();
          const paragraph = $createParagraphNode();
          listItemNode.replace(paragraph);
          paragraph.select();
          return true;
        }

        // Convert to paragraph with content
        event?.preventDefault();
        const paragraph = $createParagraphNode();

        // Move all children from list item to paragraph
        const children = listItemNode.getChildren();
        children.forEach((child) => {
          paragraph.append(child);
        });

        listItemNode.replace(paragraph);

        // Place cursor at the start of the paragraph
        paragraph.selectStart();

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
