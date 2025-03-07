import { type Transformer } from "@lexical/markdown";
import { type LexicalNode, type TextNode, $createTextNode } from "lexical";

import {
  $createMarkdownImageNode,
  $isMarkdownImageNode,
  MarkdownImageNode,
} from "../nodes/MarkdownImageNode";

// Modified regex pattern to match markdown image anywhere in the text
// Removed the $ end anchor to allow text after the pattern
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/;

// Create a custom transformer for image nodes
export const MARKDOWN_IMAGE_TRANSFORMER: Transformer = {
  dependencies: [MarkdownImageNode],
  export: (node: LexicalNode): string | null => {
    if (!$isMarkdownImageNode(node)) return null;

    const src = node.getSrc();
    const altText = node.getAltText() || "";

    return `![${altText}](${src})`;
  },

  // Match markdown image format: ![alt text](url) with potentially more text after
  importRegExp: MARKDOWN_IMAGE_REGEX,
  regExp: MARKDOWN_IMAGE_REGEX,

  type: "text-match" as const,
  replace: (textNode: TextNode, match: RegExpMatchArray): void => {
    // Extract alt text and source from the match
    const altText = String(match[1] ?? "");
    const src = String(match[2] ?? "");

    // Create an image node with the extracted data
    const imageNode = $createMarkdownImageNode({
      altText,
      src,
      maxWidth: 500, // Default max width
    });

    // Get the text content
    const textContent = textNode.getTextContent();

    // Find where the match ends in the original text
    const matchedText = match[0];
    const matchEndIndex = textContent.indexOf(matchedText) + matchedText.length;

    // Check if there's text after the image markdown
    const textAfter = textContent.substring(matchEndIndex);

    // Replace only the markdown part with the image node
    if (textAfter) {
      // Split the node: replace current with image and create a new text node after
      const newTextNode = $createTextNode(textAfter);
      textNode.replace(imageNode);
      imageNode.insertAfter(newTextNode);
    } else {
      // Simple replacement if there's no text after
      textNode.replace(imageNode);
    }
  },
};
