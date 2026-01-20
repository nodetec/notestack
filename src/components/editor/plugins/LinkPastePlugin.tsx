'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import { $createLinkNode, $isLinkNode } from '../nodes/LinkNode';

const URL_REGEX = /^https?:\/\/[^\s]+$/;

function isValidUrl(text: string): boolean {
  return URL_REGEX.test(text.trim());
}

function isYouTubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  );
}

async function fetchYouTubeTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

export default function LinkPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();

        // Only handle if it's a valid URL
        if (!isValidUrl(text)) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();

        // Create link with URL as initial display text
        const linkNode = $createLinkNode({ url: text, displayText: text });
        selection.insertNodes([linkNode]);

        // If it's a YouTube URL, fetch the title and update the link
        if (isYouTubeUrl(text)) {
          const nodeKey = linkNode.getKey();
          fetchYouTubeTitle(text).then((title) => {
            if (title) {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (node && $isLinkNode(node)) {
                  const newNode = $createLinkNode({ url: text, displayText: title });
                  node.replace(newNode);
                }
              });
            }
          });
        }

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
