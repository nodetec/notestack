'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $nodesOfType } from 'lexical';
import { registerCodeHighlighting, CodeNode } from '@lexical/code';

export default function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregister = registerCodeHighlighting(editor);
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
