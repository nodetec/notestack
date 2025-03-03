import type { ElementTransformer } from "@lexical/markdown";
import { type ElementNode, type LexicalNode } from "lexical";

import { $createYouTubeNode } from "./YouTubeNode";

/**
 * Extracts YouTube video ID from URL
 */
function extractYouTubeVideoId(text: string): string | null {
  const match =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(text);
  // Return ID only if it's the right length (11 characters)
  return match?.[2] && match[2].length === 11 ? match[2] : null;
}

/**
 * Checks if a string is a valid YouTube URL
 */
function isYouTubeUrl(text: string): boolean {
  return (
    text.includes("youtube.com") ||
    text.includes("youtu.be") ||
    text.includes("youtube-nocookie.com")
  );
}

/**
 * Transformer for converting YouTube URLs in markdown to embedded YouTube nodes
 */
export const YOUTUBE_TRANSFORMER: ElementTransformer = {
  dependencies: [],
  export: () => null,
  regExp:
    /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\S+/,
  replace: (
    parentNode: ElementNode,
    children: LexicalNode[],
    match: string[],
  ) => {
    const url = match[0];

    if (!url || !isYouTubeUrl(url)) {
      return false;
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return false;
    }

    // Create YouTube node
    const youTubeNode = $createYouTubeNode(videoId);

    // Replace the matched element with our nodes
    parentNode.replace(youTubeNode);

    return true;
  },
  type: "element",
};
