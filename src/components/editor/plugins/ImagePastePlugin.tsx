'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical';

export default function ImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const items = clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item.type.startsWith('image/')) {
            // TODO: Enable image paste when blob storage is available
            // For now, reject pasted images to avoid large base64 data URLs
            // which cause performance issues (e.g., when toggling markdown mode)
            console.warn('Image paste is not supported yet. Please use an image URL instead.');
            event.preventDefault();
            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
