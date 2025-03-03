import type { ElementTransformer } from "@lexical/markdown";
import { type ElementNode, type LexicalNode } from "lexical";

import { $createTweetNode } from "./TwitterNode";

/**
 * Extracts Tweet ID from Twitter/X URLs
 */
function extractTweetId(text: string): string | null {
  // Extract tweet ID from URLs like:
  // https://twitter.com/username/status/1234567890123456789
  // https://x.com/username/status/1234567890123456789
  // https://x.com/i/web/status/1234567890123456789
  const match =
    /(?:twitter\.com|x\.com)\/(?:\w+\/status\/|i\/web\/status\/)(\d+)/.exec(
      text,
    );

  if (match?.[1]) {
    return match[1];
  }

  // Try to extract just the ID if it's only the ID
  const idMatch = /^(\d{10,25})$/.exec(text);
  if (idMatch) {
    return idMatch[1] ?? null;
  }

  return null;
}

/**
 * Checks if a string is a valid Twitter/X URL
 */
function isTwitterUrl(text: string): boolean {
  return (
    (text.includes("twitter.com/") || text.includes("x.com/")) &&
    (text.includes("/status/") || text.includes("/i/web/status/"))
  );
}

/**
 * Transformer for converting Twitter/X URLs in markdown to embedded Twitter nodes
 */
export const TWITTER_TRANSFORMER: ElementTransformer = {
  dependencies: [],
  export: () => null,
  regExp:
    /(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/(\w+\/status\/|i\/web\/status\/)\d+(\?[^\\s]*)?/,
  replace: (
    parentNode: ElementNode,
    children: Array<LexicalNode>,
    match: Array<string>,
  ): boolean | void => {
    const url = match[0];

    if (!url || !isTwitterUrl(url)) {
      return false;
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return false;
    }

    // Create Twitter node
    const tweetNode = $createTweetNode(tweetId);

    parentNode.replace(tweetNode);

    // Return true to indicate successful transformation
    return true;
  },
  type: "element",
};
