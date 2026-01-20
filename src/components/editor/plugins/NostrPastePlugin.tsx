'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  type LexicalNode,
} from 'lexical';
import { $createNpubNode } from '../nodes/NpubNode';
import { $createNprofileNode } from '../nodes/NprofileNode';
import { $createNeventNode } from '../nodes/NeventNode';
import { $createNaddrNode } from '../nodes/NaddrNode';

// Nostr bech32 entity patterns - capture both with and without nostr: prefix
const NPUB_REGEX = /^(nostr:)?(npub1[a-z0-9]{58})$/i;
const NPROFILE_REGEX = /^(nostr:)?(nprofile1[a-z0-9]+)$/i;
const NEVENT_REGEX = /^(nostr:)?(nevent1[a-z0-9]+)$/i;
const NADDR_REGEX = /^(nostr:)?(naddr1[a-z0-9]+)$/i;

function createNostrNode(text: string): LexicalNode | null {
  let match = text.match(NPUB_REGEX);
  if (match) {
    const isEmbed = !!match[1];
    const npub = match[2];
    return $createNpubNode({ npub, isEmbed });
  }

  match = text.match(NPROFILE_REGEX);
  if (match) {
    const isEmbed = !!match[1];
    const nprofile = match[2];
    return $createNprofileNode({ nprofile, isEmbed });
  }

  match = text.match(NEVENT_REGEX);
  if (match) {
    const isEmbed = !!match[1];
    const nevent = match[2];
    return $createNeventNode({ nevent, isEmbed });
  }

  match = text.match(NADDR_REGEX);
  if (match) {
    const isEmbed = !!match[1];
    const naddr = match[2];
    return $createNaddrNode({ naddr, isEmbed });
  }

  return null;
}

export default function NostrPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain').trim();

        // Try to create a Nostr node from the pasted text
        const node = createNostrNode(text);
        if (!node) {
          return false;
        }

        // Prevent default paste behavior
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          selection.insertNodes([node]);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
