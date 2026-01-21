'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  PASTE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { ALL_TRANSFORMERS } from '../NostrEditor';

// Patterns that strongly indicate markdown content
const MARKDOWN_PATTERNS = [
  /^#{1,6}\s+\S/m,           // Headings: # Heading
  /\*\*[^*]+\*\*/,           // Bold: **text**
  /(?<!\*)\*[^*]+\*(?!\*)/,  // Italic: *text* (not preceded/followed by *)
  /~~[^~]+~~/,               // Strikethrough: ~~text~~
  /`[^`]+`/,                 // Inline code: `code`
  /^```/m,                   // Code block start
  /^\s*[-*+]\s+\S/m,         // Unordered list: - item or * item
  /^\s*\d+\.\s+\S/m,         // Ordered list: 1. item
  /\[([^\]]+)\]\(([^)]+)\)/, // Links: [text](url)
  /!\[([^\]]*)\]\(([^)]+)\)/,// Images: ![alt](url)
  /^\s*>\s+\S/m,             // Blockquote: > text
  /^\s*---\s*$/m,            // Horizontal rule
  /^\s*\*\*\*\s*$/m,         // Horizontal rule (asterisks)
  /\|.+\|.+\|/,              // Table row: | cell | cell |
];

// Patterns that indicate it's probably NOT markdown (just plain text)
const PLAIN_TEXT_INDICATORS = [
  /^https?:\/\/[^\s]+$/,     // Single URL
  /^npub1[a-z0-9]+$/i,       // Single npub
  /^nprofile1[a-z0-9]+$/i,   // Single nprofile
  /^nevent1[a-z0-9]+$/i,     // Single nevent
  /^naddr1[a-z0-9]+$/i,      // Single naddr
  /^nostr:(npub|nprofile|nevent|naddr)1[a-z0-9]+$/i, // Single nostr: URI
];

function isLikelyMarkdown(text: string): boolean {
  // If it's a single-line that matches plain text indicators, skip
  const trimmed = text.trim();
  if (!trimmed.includes('\n')) {
    for (const pattern of PLAIN_TEXT_INDICATORS) {
      if (pattern.test(trimmed)) {
        return false;
      }
    }
  }

  // Check if any markdown patterns match
  for (const pattern of MARKDOWN_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

export default function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain');
        if (!text) return false;

        // Only handle if it looks like markdown
        if (!isLikelyMarkdown(text)) return false;

        event.preventDefault();

        // Convert markdown to Lexical nodes using editor.update()
        // This mirrors how the toolbar's markdown toggle works
        editor.update(() => {
          $convertFromMarkdownString(text, ALL_TRANSFORMERS, undefined, false);
        });

        return true;
      },
      COMMAND_PRIORITY_LOW // Lower priority so URL/Nostr plugins run first
    );
  }, [editor]);

  return null;
}
