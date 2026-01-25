'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $nodesOfType } from 'lexical';
import { HeadingNode } from '@lexical/rich-text';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function HeadingAnchorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const headings = $nodesOfType(HeadingNode);
        const slugCounts = new Map<string, number>();

        headings.forEach((heading) => {
          const text = heading.getTextContent();
          const base = slugify(text || 'section');
          const count = (slugCounts.get(base) ?? 0) + 1;
          slugCounts.set(base, count);
          const slug = count === 1 ? base : `${base}-${count}`;

          const element = editor.getElementByKey(heading.getKey());
          if (element && element.id !== slug) {
            element.id = slug;
          }
        });
      });
    });
  }, [editor]);

  return null;
}
