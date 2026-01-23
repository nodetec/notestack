'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $getSelection, $isRangeSelection } from 'lexical';
import { HighlighterIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publishHighlight, deleteHighlight } from '@/lib/nostr/publish';
import { useSession } from 'next-auth/react';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import type { Highlight } from '@/lib/nostr/types';

interface HighlightPluginProps {
  // Source article information for creating new highlights
  source?: {
    kind: number;
    pubkey: string;
    identifier: string;
    relay?: string;
  };
  // Existing highlights to display
  highlights?: Highlight[];
  // Callback when a highlight is deleted
  onHighlightDeleted?: (highlightId: string) => void;
  // Callback when a highlight is created
  onHighlightCreated?: (highlight: Highlight) => void;
}

// Get all text nodes in a container
function getTextNodes(container: HTMLElement): Text[] {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  return textNodes;
}

interface HighlightRangeInfo {
  highlight: Highlight;
  range: Range;
}

// Build a map of combined text to text nodes for cross-node matching
function buildTextMap(container: HTMLElement): {
  combinedText: string;
  charMap: { node: Text; offset: number }[];
} {
  const textNodes = getTextNodes(container);
  let combinedText = '';
  const charMap: { node: Text; offset: number }[] = [];

  for (const textNode of textNodes) {
    const text = textNode.textContent || '';
    for (let i = 0; i < text.length; i++) {
      charMap.push({ node: textNode, offset: i });
      combinedText += text[i];
    }
  }

  return { combinedText, charMap };
}

// Create a range that may span multiple text nodes
function createCrossNodeRange(
  charMap: { node: Text; offset: number }[],
  startIndex: number,
  length: number
): Range | null {
  if (startIndex < 0 || startIndex >= charMap.length) return null;

  const endIndex = Math.min(startIndex + length - 1, charMap.length - 1);
  if (endIndex < startIndex) return null;

  const startInfo = charMap[startIndex];
  const endInfo = charMap[endIndex];

  const range = new Range();
  range.setStart(startInfo.node, startInfo.offset);
  range.setEnd(endInfo.node, endInfo.offset + 1);

  return range;
}

// Apply highlights using CSS Custom Highlight API (doesn't modify DOM)
function applyHighlightsWithCSS(
  container: HTMLElement,
  highlights: Highlight[]
): { cleanup: () => void; rangeInfos: HighlightRangeInfo[] } {
  // Check if CSS Highlight API is supported
  if (!('highlights' in CSS)) {
    console.log('CSS Highlight API not supported');
    return { cleanup: () => {}, rangeInfos: [] };
  }

  // Deduplicate highlights by content (keep the first one for each content)
  const seenContent = new Set<string>();
  const uniqueHighlights = highlights.filter((h) => {
    const key = h.content.trim();
    if (seenContent.has(key)) return false;
    seenContent.add(key);
    return true;
  });

  const ranges: Range[] = [];
  const rangeInfos: HighlightRangeInfo[] = [];

  // Build combined text map for cross-node matching
  const { combinedText, charMap } = buildTextMap(container);

  for (const highlight of uniqueHighlights) {
    const searchText = highlight.content.trim();
    if (!searchText || searchText.length < 3) continue;

    // Find match in combined text (handles cross-node matches)
    const index = combinedText.indexOf(searchText);

    if (index !== -1) {
      const range = createCrossNodeRange(charMap, index, searchText.length);
      if (range) {
        ranges.push(range);
        rangeInfos.push({ highlight, range });
      }
    }
  }

  if (ranges.length > 0) {
    // Create a Highlight object and register it
    const cssHighlight = new (window as any).Highlight(...ranges);
    (CSS as any).highlights.set('nostr-highlights', cssHighlight);
  }

  // Return cleanup function and range infos
  return {
    cleanup: () => {
      if ('highlights' in CSS) {
        (CSS as any).highlights.delete('nostr-highlights');
      }
    },
    rangeInfos,
  };
}

export default function HighlightPlugin({ source, highlights = [], onHighlightDeleted, onHighlightCreated }: HighlightPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [selectedText, setSelectedText] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [clickedHighlight, setClickedHighlight] = useState<Highlight | null>(null);
  const [deletePopoverPosition, setDeletePopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const relays = useSettingsStore((state) => state.relays);
  const cleanupRef = useRef<(() => void) | null>(null);
  const rangeInfosRef = useRef<HighlightRangeInfo[]>([]);

  // Only show highlight creation UI when viewing (not editing) and logged in
  const canHighlight = !isEditable && !!pubkey && !!source;

  // Add CSS for highlights (only once)
  useEffect(() => {
    if (!('highlights' in CSS)) return;

    const styleId = 'nostr-highlight-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      ::highlight(nostr-highlights) {
        background-color: rgba(253, 224, 71, 0.5);
        color: inherit;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Apply existing highlights using CSS Highlight API
  useEffect(() => {
    if (isEditable || highlights.length === 0) {
      // Clean up any existing highlights
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      rangeInfosRef.current = [];
      return;
    }

    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const rootElement = editor.getRootElement();
      if (!rootElement) return;

      // Clean up previous highlights
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      // Apply new highlights using CSS Highlight API
      const { cleanup, rangeInfos } = applyHighlightsWithCSS(rootElement, highlights);
      cleanupRef.current = cleanup;
      rangeInfosRef.current = rangeInfos;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      rangeInfosRef.current = [];
    };
  }, [editor, isEditable, highlights]);

  // Handle clicks on highlighted text
  useEffect(() => {
    if (isEditable || highlights.length === 0) return;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (e: MouseEvent) => {
      // Don't show delete popover if there's a text selection being made
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;

      // Check if click is inside any highlight range
      const clickX = e.clientX;
      const clickY = e.clientY;

      for (const { highlight, range } of rangeInfosRef.current) {
        const rects = range.getClientRects();
        for (const rect of rects) {
          if (
            clickX >= rect.left &&
            clickX <= rect.right &&
            clickY >= rect.top &&
            clickY <= rect.bottom
          ) {
            // Clicked on a highlight - only show delete if user owns it
            if (highlight.pubkey === pubkey) {
              setClickedHighlight(highlight);
              setDeletePopoverPosition({
                top: rect.top - 40,
                left: rect.left + rect.width / 2,
              });
            }
            return;
          }
        }
      }

      // Clicked outside highlights, clear delete popover
      setClickedHighlight(null);
      setDeletePopoverPosition(null);
    };

    rootElement.addEventListener('click', handleClick);
    return () => rootElement.removeEventListener('click', handleClick);
  }, [editor, isEditable, highlights, pubkey]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!clickedHighlight || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteHighlight({
        eventId: clickedHighlight.id,
        relays,
        secretKey,
      });

      // Notify parent to remove from local state
      onHighlightDeleted?.(clickedHighlight.id);

      // Clear popover
      setClickedHighlight(null);
      setDeletePopoverPosition(null);
    } catch (error) {
      console.error('Failed to delete highlight:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [clickedHighlight, relays, isDeleting, onHighlightDeleted]);

  const updatePopover = useCallback(() => {
    if (!canHighlight) {
      setPopoverPosition(null);
      setSelectedText('');
      return;
    }

    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        setPopoverPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.getTextContent().trim();
      if (!text || text.length < 3) {
        setPopoverPosition(null);
        setSelectedText('');
        return;
      }

      setSelectedText(text);

      // Get context (surrounding text from the paragraph)
      const anchorNode = selection.anchor.getNode();
      const topLevelElement = anchorNode.getTopLevelElement();
      if (topLevelElement) {
        const paragraphText = topLevelElement.getTextContent();
        if (paragraphText !== text) {
          setContext(paragraphText);
        } else {
          setContext('');
        }
      }
    });

    // Get selection position from DOM
    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setPopoverPosition(null);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0) {
      setPopoverPosition(null);
      return;
    }

    setPopoverPosition({
      top: rect.top - 40, // Position above selection
      left: rect.left + rect.width / 2, // Center horizontally
    });
  }, [editor, canHighlight]);

  useEffect(() => {
    if (!canHighlight) return;

    // Listen for selection changes
    const handleSelectionChange = () => {
      updatePopover();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [canHighlight, updatePopover]);

  const handleHighlight = useCallback(async () => {
    if (!source || !selectedText || isPublishing) return;

    setIsPublishing(true);
    try {
      const { event } = await publishHighlight({
        content: selectedText,
        context: context || undefined,
        source: {
          kind: source.kind,
          pubkey: source.pubkey,
          identifier: source.identifier,
          relay: source.relay,
        },
        authorPubkey: source.pubkey, // Attribute to the article author
        relays,
        secretKey,
      });

      // Create local highlight object and notify parent
      const newHighlight: Highlight = {
        id: event.id,
        pubkey: event.pubkey,
        createdAt: event.createdAt,
        content: selectedText,
        context: context || undefined,
        source: {
          kind: source.kind,
          pubkey: source.pubkey,
          identifier: source.identifier,
        },
        authorPubkey: source.pubkey,
      };
      onHighlightCreated?.(newHighlight);

      // Clear selection after successful highlight
      window.getSelection()?.removeAllRanges();
      setPopoverPosition(null);
      setSelectedText('');
    } catch (error) {
      console.error('Failed to publish highlight:', error);
    } finally {
      setIsPublishing(false);
    }
  }, [source, selectedText, context, relays, isPublishing, onHighlightCreated]);

  // Render create highlight popover
  const createPopover = canHighlight && popoverPosition && selectedText ? createPortal(
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        size="sm"
        variant="secondary"
        className="shadow-lg border border-border gap-1.5"
        onClick={handleHighlight}
        disabled={isPublishing}
      >
        {isPublishing ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <HighlighterIcon className="size-4" />
        )}
        Highlight
      </Button>
    </div>,
    document.body
  ) : null;

  // Render delete highlight popover
  const deletePopover = deletePopoverPosition && clickedHighlight ? createPortal(
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${deletePopoverPosition.top}px`,
        left: `${deletePopoverPosition.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        size="sm"
        variant="destructive"
        className="shadow-lg gap-1.5 bg-red-600 hover:bg-red-700"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <Trash2Icon className="size-4" />
        )}
        Delete
      </Button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {createPopover}
      {deletePopover}
    </>
  );
}
