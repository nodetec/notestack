import { Heading, Text, type Root } from "mdast";
import { type Event } from "nostr-tools";
import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified, type Plugin } from "unified";
import { visit } from "unist-util-visit";

import { getTag } from "./nostr";

export function getFirstImage(markdown: string) {
  const regex = /!\[.*\]\((.*)\)/;
  const match = regex.exec(markdown);

  if (match) {
    return match[1];
  }

  return undefined;
}

export function parseContent(markdownContent: string) {
  // Split the content into lines
  const lines = markdownContent.split("\n");

  // Check if the first line is a header
  const firstLine = lines[0]?.trim();
  if (!firstLine) {
    return "";
  }
  const isHeader = /^#+\s+(.*)$/.test(firstLine);

  // Determine the starting index for processing lines
  const startIndex = isHeader ? 1 : 0;

  // Filter out empty lines and lines containing Markdown image elements
  const filteredLines = lines
    .slice(startIndex) // Start from the second line if the first line is a header
    .filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine !== "" && !/^!\[.*\]\(.*\)$/.test(trimmedLine);
    });

  // Join the lines back together with newlines
  const content = filteredLines.join("\n");

  return content;
}

interface RemoveHeadingPluginOptions {
  headingText?: string;
}

const removeHeadingPlugin: Plugin<[RemoveHeadingPluginOptions?], Root> = ({
  headingText,
} = {}) => {
  if (!headingText) {
    return () => {};
  }

  return (tree: Root) => {
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading") {
        const headingNode = node;
        const textNode = headingNode.children.find(
          (child) => child.type === "text" && child.value === headingText,
        );

        if (textNode) {
          return false; // Remove this heading
        }
      }
      return true; // Keep other nodes
    });
  };
};

export function processArticle(event: Event | undefined) {
  if (!event) {
    return "";
  }
  console.log("Processing article", event);
  const title = getTag("title", event.tags);
  const image = getTag("image", event.tags);

  const processedContent = unified()
    .use(remarkParse)
    .use(remarkHtml)
    .use(removeHeadingPlugin, { headingText: title })
    .processSync(event.content)
    .toString();

  return processedContent;
}
