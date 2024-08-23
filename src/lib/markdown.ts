import remarkHtml from "remark-html";
import remarkParse from "remark-parse";
import { unified } from "unified";

export function getFirstImage(markdown: string) {
  const regex = /!\[.*\]\((.*)\)/;
  const match = regex.exec(markdown);

  if (match) {
    return match[1];
  }

  return "";
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

export function processContent(content: string) {
  const processedContent = unified()
    .use(remarkParse)
    .use(remarkHtml)
    .processSync(content)
    .toString();

  return processedContent;
}
