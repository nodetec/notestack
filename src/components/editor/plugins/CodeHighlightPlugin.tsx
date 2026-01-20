'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeHighlighting } from '@lexical/code';

export default function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
}
