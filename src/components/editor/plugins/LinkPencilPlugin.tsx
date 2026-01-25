'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isLinkNode, LinkNode } from '@lexical/link';
import {
  $createLinkPencilNode,
  $isLinkPencilNode,
  LinkPencilNode,
} from '../nodes/LinkPencilNode';

export default function LinkPencilPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(LinkNode, (node) => {
      if (!$isLinkNode(node)) {
        return;
      }
      if (node.getURL().startsWith('#')) {
        const nextSibling = node.getNextSibling();
        if ($isLinkPencilNode(nextSibling)) {
          nextSibling.remove();
        }
        return;
      }
      const nextSibling = node.getNextSibling();
      if ($isLinkPencilNode(nextSibling)) {
        if (nextSibling.getLinkKey() !== node.getKey()) {
          nextSibling.setLinkKey(node.getKey());
        }
        return;
      }
      node.insertAfter($createLinkPencilNode(node.getKey()));
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerNodeTransform(LinkPencilNode, (node) => {
      const prevSibling = node.getPreviousSibling();
      if (!$isLinkNode(prevSibling) || prevSibling.getKey() !== node.getLinkKey()) {
        node.remove();
      }
    });
  }, [editor]);

  return null;
}
