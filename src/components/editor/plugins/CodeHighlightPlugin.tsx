'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $nodesOfType } from 'lexical';
import {
  registerCodeHighlighting,
  CodeNode,
  PrismTokenizer,
} from '@lexical/code';

/**
 * Custom tokenizer that defaults to 'plain' instead of 'javascript'.
 * Lexical's built-in PrismTokenizer forces 'javascript' on code blocks
 * without a language, which is unexpected for users who just type ```.
 * 'plain' is a valid Prism language that applies no syntax highlighting.
 */
const tokenizer = { ...PrismTokenizer, defaultLanguage: 'plain' };

export default function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = registerCodeHighlighting(editor, tokenizer);
    editor.update(() => {
      const codeNodes = $nodesOfType(CodeNode);
      for (const node of codeNodes) {
        node.getWritable();
      }
    });
    return unregister;
  }, [editor]);

  return null;
}
