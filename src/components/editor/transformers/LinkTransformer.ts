import type { TextMatchTransformer } from '@lexical/markdown';
import { $createLinkNode, $isLinkNode, LinkNode } from '../nodes/LinkNode';

export const LINK: TextMatchTransformer = {
  dependencies: [LinkNode],
  export: (node) => {
    if (!$isLinkNode(node)) {
      return null;
    }
    const displayText = node.getDisplayText();
    const url = node.getUrl();
    // Always use markdown link format to prevent raw URLs from being
    // auto-converted by other transformers (e.g., YouTube)
    return `[${displayText || url}](${url})`;
  },
  // Match [text](url) format
  importRegExp: /\[([^\]]+)\]\(([^)]+)\)/,
  regExp: /\[([^\]]+)\]\(([^)]+)\)$/,
  trigger: ')',
  replace: (textNode, match) => {
    const [, displayText, url] = match;
    const linkNode = $createLinkNode({ url, displayText });
    textNode.replace(linkNode);
  },
  type: 'text-match',
};
