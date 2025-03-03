import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type TextNode,
} from "lexical";

import { $createImageNode } from "./ImageNode";

/**
 * React component that adds markdown image shortcut functionality to a Lexical editor
 * Detects patterns like ![alt text](url) and converts them to image nodes
 */
export const MarkdownImageShortcutPlugin = () => {
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

        // We only want to trigger transforms as user types with a collapsed selection
        if (
          !$isRangeSelection(prevSelection) ||
          !$isRangeSelection(selection) ||
          !selection.isCollapsed() ||
          selection.is(prevSelection)
        ) {
          return;
        }

        const anchorKey = selection.anchor.key;
        const anchorOffset = selection.anchor.offset;

        const anchorNode = editorState._nodeMap.get(anchorKey);

        if (
          !$isTextNode(anchorNode) ||
          !dirtyLeaves.has(anchorKey) ||
          (anchorOffset !== 1 && anchorOffset > prevSelection.anchor.offset + 1)
        ) {
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

          transformImageMarkdown(
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
   * Transform markdown image syntax to an image node
   */
  const transformImageMarkdown = (
    _parentNode: ElementNode,
    anchorNode: TextNode,
    anchorOffset: number,
  ) => {
    const textContent = anchorNode.getTextContent();

    // Define the image markdown pattern: ![alt text](url)
    const IMAGE_MARKDOWN_REGEX = /!\[(.*?)\]\((.*?)\)/;

    // Look for markdown image pattern
    const match = IMAGE_MARKDOWN_REGEX.exec(textContent);

    if (!match) {
      return false;
    }

    const [fullMatch, altText, url = ""] = match;
    const matchStartIndex = textContent.indexOf(fullMatch);
    const matchEndIndex = matchStartIndex + fullMatch.length;

    // Check if the cursor is just after the pattern
    if (matchEndIndex !== anchorOffset) {
      return false;
    }

    // Split text at the markdown pattern
    if (matchStartIndex > 0) {
      anchorNode.splitText(matchStartIndex);
    }

    let nodeToReplace;
    if (matchStartIndex === 0) {
      nodeToReplace = anchorNode;
    } else {
      const [, nodeToReplace_] = anchorNode.splitText(
        matchStartIndex,
        matchEndIndex,
      );
      nodeToReplace = nodeToReplace_;
    }

    // Create and insert the image node
    const imageNode = $createImageNode({
      src: url,
      altText: altText ?? "",
    });

    if (nodeToReplace) {
      nodeToReplace.replace(imageNode);
    }
    return true;
  };

  // This component doesn't render anything visible
  return null;
};