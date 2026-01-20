/**
 * Extracts the first image URL from markdown content
 * Supports ![alt](url) format
 */
export function extractFirstImage(content: string): string | null {
  // Match markdown image: ![alt](url)
  const markdownMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  // Also try to match raw image URLs
  const urlMatch = content.match(/https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)/i);
  if (urlMatch) {
    return urlMatch[0];
  }

  return null;
}
