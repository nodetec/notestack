'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from 'lexical';
import { $createImageNode } from '../nodes/ImageNode';

export default function ImagePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const items = clipboardData.items;
        let hasImage = false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item.type.startsWith('image/')) {
            hasImage = true;
            const file = item.getAsFile();
            if (!file) continue;

            // Convert image to base64 data URL
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;

              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  const imageNode = $createImageNode({
                    src: dataUrl,
                    altText: file.name || 'Pasted image',
                  });
                  $insertNodes([imageNode]);
                }
              });
            };
            reader.readAsDataURL(file);
          }
        }

        // If we handled an image paste, prevent default handling
        if (hasImage) {
          event.preventDefault();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
