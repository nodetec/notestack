'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  $getNodeByKey,
} from 'lexical';
import { $isTableNode, TableNode } from '@lexical/table';

/**
 * Plugin that prevents clicks outside table content from focusing into the table.
 * When clicking to the right/left of a table, this ensures the cursor
 * is placed in an adjacent paragraph rather than jumping into the table.
 */
export default function TableClickOutsidePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorRoot = editor.getRootElement();
    if (!editorRoot) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Only handle clicks directly on the editor root
      if (target !== editorRoot) return;

      const clickX = event.clientX;
      const clickY = event.clientY;

      // Find all table scroll wrappers (divs with overflow-x: auto that contain tables)
      const tables = editorRoot.querySelectorAll('table');

      for (const table of tables) {
        // Get the scroll wrapper (parent div with overflow-x: auto)
        const scrollWrapper = table.parentElement;
        if (!scrollWrapper) continue;

        const wrapperRect = scrollWrapper.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();

        // Check if click Y is within the wrapper's vertical bounds
        if (clickY >= wrapperRect.top && clickY <= wrapperRect.bottom) {
          // Click is vertically aligned with this table
          const isClickToRight = clickX > wrapperRect.right;
          const isClickToLeft = clickX < wrapperRect.left;

          if (isClickToRight || isClickToLeft) {
            event.preventDefault();
            event.stopPropagation();

            // Find the table node by looking for it in Lexical's state
            editor.update(() => {
              const root = $getRoot();
              const children = root.getChildren();

              // Find the table node that corresponds to this DOM table
              let tableNode: TableNode | null = null;
              for (const child of children) {
                if ($isTableNode(child)) {
                  const tableKey = child.getKey();
                  const domElement = editor.getElementByKey(tableKey);
                  // The table element might be the table itself or we need to find it
                  if (domElement === table || domElement?.querySelector('table') === table || domElement === scrollWrapper) {
                    tableNode = child;
                    break;
                  }
                }
              }

              // Fallback: just use the first table found
              if (!tableNode) {
                for (const child of children) {
                  if ($isTableNode(child)) {
                    tableNode = child;
                    break;
                  }
                }
              }

              if (tableNode) {
                if (isClickToRight) {
                  const nextSibling = tableNode.getNextSibling();
                  if (nextSibling) {
                    nextSibling.selectStart();
                  } else {
                    const paragraph = $createParagraphNode();
                    tableNode.insertAfter(paragraph);
                    paragraph.select();
                  }
                } else {
                  const prevSibling = tableNode.getPreviousSibling();
                  if (prevSibling) {
                    prevSibling.selectEnd();
                  } else {
                    const paragraph = $createParagraphNode();
                    tableNode.insertBefore(paragraph);
                    paragraph.select();
                  }
                }
              }
            });

            return;
          }
        }
      }
    };

    // Use capture phase to intercept before Lexical's handlers
    editorRoot.addEventListener('mousedown', handleMouseDown, { capture: true });

    return () => {
      editorRoot.removeEventListener('mousedown', handleMouseDown, { capture: true });
    };
  }, [editor]);

  return null;
}
