import { type Transformer } from "@lexical/markdown";
import { type LexicalNode, type TextNode } from "lexical";

import { $createImageNode, $isImageNode, ImageNode } from "./ImageNode";

// Special regex pattern for markdown image that triggers immediately after typing ")"
// The $ ensures it triggers exactly when the pattern is completed
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)$/;

// Create a custom transformer for image nodes
const IMAGE_TRANSFORMER: Transformer = {
  dependencies: [ImageNode],
  export: (node: LexicalNode): string | null => {
    if (!$isImageNode(node)) return null;

    const src = node.getSrc();
    const altText = node.getAltText() || "";

    return `![${altText}](${src})`;
  },

  // Match markdown image format: ![alt text](url)
  importRegExp: MARKDOWN_IMAGE_REGEX,
  regExp: MARKDOWN_IMAGE_REGEX,

  type: "text-match" as const,
  replace: (textNode: TextNode, match: RegExpMatchArray): void => {
    // Extract alt text and source from the match
    const altText = String(match[1] ?? "");
    const src = String(match[2] ?? "");

    console.log("Image transformer triggered!", { altText, src });

    // Create an image node with the extracted data
    const imageNode = $createImageNode({
      altText,
      src,
      maxWidth: 500, // Default max width
    });

    // Replace the text node with the image node
    textNode.replace(imageNode);
  },
};

export default IMAGE_TRANSFORMER;
