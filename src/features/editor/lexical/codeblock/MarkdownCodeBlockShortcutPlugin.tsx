import { useEffect } from "react";

import { $createCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import {
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type ElementNode,
  type TextNode,
} from "lexical";

/**
 * React component that adds markdown code block shortcut functionality to a Lexical editor
 * Detects patterns like ``` and converts them to code block nodes
 */
export const MarkdownCodeBlockShortcutPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) {
      return;
    }

    const removeUpdateListener = editor.registerUpdateListener(
      ({ tags, dirtyLeaves, editorState, prevEditorState }) => {
        // Ignore updates from collaboration and undo/redo
        if (tags.has("collaboration") || tags.has("historic")) {
          return;
        }

        // If editor is still composing, wait until user confirms the key
        if (editor.isComposing()) {
          return;
        }

        const selection = editorState.read($getSelection);
        const prevSelection = prevEditorState.read($getSelection);

        // We want to trigger transforms as user types with a collapsed selection
        if (
          !$isRangeSelection(prevSelection) ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed()
        ) {
          return;
        }

        const anchorKey = selection.anchor.key;

        const anchorNode = editorState._nodeMap.get(anchorKey);

        // Check if the node is a text node and has been updated
        if (!$isTextNode(anchorNode) || !dirtyLeaves.has(anchorKey)) {
          return;
        }

        // Apply the transformation
        editor.update(() => {
          if (!$isTextNode(anchorNode)) {
            return;
          }

          const parentNode = anchorNode.getParent();
          if (parentNode === null) {
            return;
          }

          transformCodeBlockMarkdown(
            parentNode,
            anchorNode,
            selection.anchor.offset,
          );
        });
      },
    );

    // Clean up the listener on unmount
    return removeUpdateListener;
  }, [editor]);

  /**
   * Transform markdown code block syntax to a code block node
   */
  const transformCodeBlockMarkdown = (
    parentNode: ElementNode,
    anchorNode: TextNode,
    anchorOffset: number,
  ) => {
    const textContent = anchorNode.getTextContent();

    // Check if this node ends with exactly ```
    const endsWithTripleBacktick = textContent.endsWith("```");

    // Check if the cursor is right after the ```
    if (!endsWithTripleBacktick || anchorOffset !== textContent.length) {
      return false;
    }

    // Remove the backticks from the text content
    const cleanContent = textContent.slice(0, -3).trim();
    anchorNode.setTextContent(cleanContent);

    // Create a selection over the parent paragraph
    const selection = $createRangeSelection();
    selection.anchor.set(parentNode.getKey(), 0, "element");
    selection.focus.set(
      parentNode.getKey(),
      parentNode.getChildrenSize(),
      "element",
    );
    $setSelection(selection);

    // Create the code block
    const codeNode = $createCodeNode();

    // Transform the selection to a code block
    $setBlocksType(selection, () => codeNode);

    return true;
  };

  // This component doesn't render anything visible
  return null;
};
