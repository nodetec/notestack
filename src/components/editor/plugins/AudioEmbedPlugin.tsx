'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $createAudioNode, $isAudioNode } from '@/components/editor/nodes/AudioNode';

interface AudioEmbedPluginProps {
  url?: string;
  mime?: string;
  enabled?: boolean;
}

export default function AudioEmbedPlugin({ url, mime, enabled }: AudioEmbedPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled || !url) return;

    editor.update(() => {
      const root = $getRoot();
      const existing = root.getChildren().find((child) => $isAudioNode(child));
      if (existing && $isAudioNode(existing) && existing.getUrl() === url) {
        return;
      }
      const audioNode = $createAudioNode({ url, mime });
      const firstChild = root.getFirstChild();
      if (firstChild) {
        firstChild.insertBefore(audioNode);
      } else {
        root.append(audioNode);
      }
    });
  }, [editor, url, mime, enabled]);

  return null;
}
