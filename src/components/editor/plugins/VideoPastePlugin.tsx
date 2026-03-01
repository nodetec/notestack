'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  PASTE_COMMAND,
} from 'lexical';
import { $createVideoNode } from '../nodes/VideoNode';

const VIDEO_URL_REGEX = /^https?:\/\/\S+\.mp4(?:\?\S*)?(?:#\S*)?$/i;

function isValidVideoUrl(text: string): boolean {
  return VIDEO_URL_REGEX.test(text.trim());
}

export default function VideoPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();
        if (!isValidVideoUrl(text)) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();
        const videoNode = $createVideoNode({ url: text, mime: 'video/mp4' });
        selection.insertNodes([videoNode]);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  return null;
}
