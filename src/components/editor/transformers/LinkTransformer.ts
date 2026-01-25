import type { TextMatchTransformer } from '@lexical/markdown';
import { $createTextNode } from 'lexical';
import { $createLinkNode, $isLinkNode, LinkNode } from '@lexical/link';

function getLinkAttributes(url: string) {
  if (url.startsWith('#')) {
    return undefined;
  }
  return { target: '_blank', rel: 'noopener noreferrer' };
}

export const LINK: TextMatchTransformer = {
  dependencies: [LinkNode],
  export: (node) => {
    if (!$isLinkNode(node)) {
      return null;
    }
    const displayText = node.getTextContent();
    const url = node.getURL();
    // Always use markdown link format to prevent raw URLs from being
    // auto-converted by other transformers (e.g., YouTube)
    return `[${displayText || url}](${url})`;
  },
  // Match [text](url) format, but NOT ![text](url) which is an image
  importRegExp: /(?<!!)\[([^\]]+)\]\(([^)]+)\)/,
  regExp: /(?<!!)\[([^\]]+)\]\(([^)]+)\)$/,
  trigger: ')',
  replace: (textNode, match) => {
    const [, displayText, url] = match;
    const linkNode = $createLinkNode(url, getLinkAttributes(url));
    linkNode.append($createTextNode(displayText));
    textNode.replace(linkNode);
  },
  type: 'text-match',
};
