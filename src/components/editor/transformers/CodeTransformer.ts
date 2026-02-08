import type { MultilineElementTransformer } from '@lexical/markdown';
import { CODE } from '@lexical/markdown';
import { $isCodeNode } from '@lexical/code';
import type { LexicalNode } from 'lexical';

/**
 * Custom CODE transformer that treats 'plain' as no language.
 *
 * Lexical's built-in CODE transformer outputs the node's language
 * directly (e.g. ```plain), but our CodeHighlightPlugin defaults
 * code blocks without a language to 'plain' so Prism doesn't force
 * JavaScript highlighting. This transformer maps 'plain' back to ''
 * so the markdown output is just ``` with no language tag.
 */
export const CODE_BLOCK: MultilineElementTransformer = {
  ...CODE,
  export: (node: LexicalNode) => {
    if (!$isCodeNode(node)) {
      return null;
    }
    const language = node.getLanguage();
    const languageTag = language && language !== 'plain' ? language : '';
    const textContent = node.getTextContent();
    return (
      '```' +
      languageTag +
      (textContent ? '\n' + textContent : '') +
      '\n' +
      '```'
    );
  },
};
