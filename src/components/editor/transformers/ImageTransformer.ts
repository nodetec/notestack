import type { TextMatchTransformer } from '@lexical/markdown';
import { $createImageNode, $isImageNode, ImageNode } from '../nodes/ImageNode';

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!\[([^\]]*)\]\(([^)]+)\)$/,
  trigger: ')',
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({ src, altText });
    textNode.replace(imageNode);
  },
  type: 'text-match',
};
