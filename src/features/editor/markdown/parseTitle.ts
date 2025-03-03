export function parseTitle(markdownContent: string | undefined) {
  if (!markdownContent) {
    return "Untitled";
  }

  // Split the content into lines
  const lines = markdownContent.split("\n");

  // Get the first line
  const firstLine = lines[0]?.trim() ?? "";

  // Check if the first line is a header
  const headerMatch = /^#+\s+(.*)$/.exec(firstLine);

  if (headerMatch) {
    // Extract and return the title without the header markdown and remove ** on either side
    return headerMatch[1]?.replace(/^\*\*(.*)\*\*$/, "$1") ?? "";
  }

  // Return "Untitled" if no title is found
  return "Untitled";
}
