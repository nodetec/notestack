import type { ElementTransformer } from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/extension';
import type { LexicalNode } from 'lexical';

export const HORIZONTAL_RULE: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '---' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};
