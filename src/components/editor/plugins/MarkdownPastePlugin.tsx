'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  PASTE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  createEditor,
  $parseSerializedNode,
  ParagraphNode,
  TextNode,
} from 'lexical';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { HorizontalRuleNode } from '@lexical/extension';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { LinkNode } from '@lexical/link';
import { ALL_TRANSFORMERS } from '../NostrEditor';
import { ImageNode } from '../nodes/ImageNode';
import { YouTubeNode } from '../nodes/YouTubeNode';

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

// Check if content looks like JSON or JSONC (JSON with comments)
function isLikelyJSON(text: string): boolean {
  const trimmed = text.trim();
  // Check if it starts with [ or { and ends with ] or }
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    // Try to parse as-is first
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      // Try stripping comments (JSONC support)
      const withoutComments = trimmed
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
      try {
        JSON.parse(withoutComments);
        return true;
      } catch {
        // Still not valid JSON, but if it has JSON-like structure, skip markdown
        // Check for typical JSON patterns: "key": value
        if (/"[^"]+"\s*:\s*/.test(trimmed)) {
          return true;
        }
        return false;
      }
    }
  }
  return false;
}

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

// Create a headless editor to parse markdown without affecting the main editor
function createMarkdownParser() {
  return createEditor({
    namespace: 'MarkdownParser',
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      ImageNode,
      LinkNode,
      YouTubeNode,
      ParagraphNode,
      TextNode,
    ],
    onError: (error) => console.error('Markdown parser error:', error),
  });
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

        // Skip if it looks like JSON
        if (isLikelyJSON(text)) return false;

        // Only handle if it looks like markdown
        if (!isLikelyMarkdown(text)) return false;

        event.preventDefault();

        // Use a headless editor to parse markdown, then insert nodes
        const parserEditor = createMarkdownParser();

        parserEditor.update(() => {
          $convertFromMarkdownString(text, ALL_TRANSFORMERS, undefined, false);
        }, { discrete: true });

        // Get the full editor state JSON which includes all nested children
        const parsedStateJSON = parserEditor.getEditorState().toJSON();
        const rootChildren = parsedStateJSON.root?.children || [];

        // Insert into main editor at current selection
        editor.update(() => {
          const selection = $getSelection();

          // Import nodes from JSON using Lexical's parser (handles nested children)
          const nodesToInsert = rootChildren.map((json: any) => $parseSerializedNode(json));

          if ($isRangeSelection(selection)) {
            selection.insertNodes(nodesToInsert);
          } else {
            // Fallback: append to root
            const root = $getRoot();
            nodesToInsert.forEach(node => root.append(node));
          }
        });

        return true;
      },
      COMMAND_PRIORITY_LOW // Lower priority so URL/Nostr plugins run first
    );
  }, [editor]);

  return null;
}
