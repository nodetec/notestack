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
  // Optional highlight id to scroll to once highlights are applied
  scrollToHighlightId?: string | null;
  // Called after highlight auto-scroll has settled (matched or exhausted)
  onScrollToHighlightSettled?: (matched: boolean) => void;
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
    if (node.textContent && node.textContent.length > 0) {
      textNodes.push(node);
    }
  }
  return textNodes;
}

interface HighlightRangeInfo {
  highlight: Highlight;
  range: Range;
}

interface CSSHighlightsRegistry {
  set(name: string, highlight: unknown): void;
  delete(name: string): void;
}

interface WindowWithHighlightCtor extends Window {
  Highlight: new (...ranges: Range[]) => unknown;
}

const isHighlightDebugEnabled = process.env.NODE_ENV !== 'production';

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function previewText(value: string, max = 160): string {
  if (!value) return '';
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

function logHighlightDebug(label: string, payload: Record<string, unknown>) {
  if (!isHighlightDebugEnabled) return;
  console.log(`[HighlightDebug] ${label}`, payload);
}

function findTopLevelChild(container: HTMLElement, node: Node): Node | null {
  let current: Node | null = node;
  while (current?.parentNode) {
    if (current.parentNode === container) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build a map of combined text to text nodes for cross-node matching
function buildTextMap(container: HTMLElement): {
  combinedText: string;
  charMap: ({ node: Text; offset: number } | null)[];
}
function buildTextMap(
  container: HTMLElement,
  includeBlockSeparators: boolean
): {
  combinedText: string;
  charMap: ({ node: Text; offset: number } | null)[];
}
function buildTextMap(
  container: HTMLElement,
  includeBlockSeparators = true
): {
  combinedText: string;
  charMap: ({ node: Text; offset: number } | null)[];
} {
  const textNodes = getTextNodes(container);
  let combinedText = '';
  const charMap: ({ node: Text; offset: number } | null)[] = [];
  let previousTopLevel: Node | null = null;

  for (const textNode of textNodes) {
    const currentTopLevel = findTopLevelChild(container, textNode);
    // Add a virtual line break between top-level blocks so multi-paragraph
    // highlights can be matched even when DOM text nodes are contiguous.
    if (
      includeBlockSeparators &&
      previousTopLevel &&
      currentTopLevel &&
      currentTopLevel !== previousTopLevel
    ) {
      combinedText += '\n';
      charMap.push(null);
    }

    const text = textNode.textContent || '';
    for (let i = 0; i < text.length; i++) {
      charMap.push({ node: textNode, offset: i });
      combinedText += text[i];
    }

    previousTopLevel = currentTopLevel;
  }

  return { combinedText, charMap };
}

// Create a range that may span multiple text nodes
function createCrossNodeRange(
  charMap: ({ node: Text; offset: number } | null)[],
  startIndex: number,
  length: number
): Range | null {
  if (startIndex < 0 || startIndex >= charMap.length) return null;

  let endIndex = Math.min(startIndex + length - 1, charMap.length - 1);
  if (endIndex < startIndex || length <= 0) return null;

  let resolvedStart = startIndex;
  while (resolvedStart <= endIndex && !charMap[resolvedStart]) {
    resolvedStart += 1;
  }

  while (endIndex >= resolvedStart && !charMap[endIndex]) {
    endIndex -= 1;
  }

  if (resolvedStart > endIndex) return null;

  const startInfo = charMap[resolvedStart];
  const endInfo = charMap[endIndex];
  if (!startInfo || !endInfo) return null;

  const range = new Range();
  range.setStart(startInfo.node, startInfo.offset);
  range.setEnd(endInfo.node, endInfo.offset + 1);

  return range;
}

function findWhitespaceTolerantMatch(
  haystack: string,
  needle: string
): { index: number; length: number } | null {
  const tokens = needle
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const pattern = tokens.map(escapeRegExp).join('\\s+');
  const match = new RegExp(pattern, 'm').exec(haystack);
  if (!match || typeof match.index !== 'number') return null;
  return { index: match.index, length: match[0].length };
}

function isAlphaNumeric(char: string): boolean {
  return /[\p{L}\p{N}]/u.test(char);
}

function buildNormalizedAlphaNumericView(value: string): {
  normalized: string;
  originalIndices: number[];
} {
  let normalized = '';
  const originalIndices: number[] = [];
  let previousWasSpace = false;

  for (let i = 0; i < value.length; i += 1) {
    const normalizedChunk = value[i].normalize('NFKC').toLowerCase();
    for (const ch of normalizedChunk) {
      if (/\s/u.test(ch)) {
        if (!previousWasSpace && normalized.length > 0) {
          normalized += ' ';
          originalIndices.push(i);
          previousWasSpace = true;
        }
        continue;
      }
      if (isAlphaNumeric(ch)) {
        normalized += ch;
        originalIndices.push(i);
        previousWasSpace = false;
      }
    }
  }

  return { normalized: normalized.trim(), originalIndices };
}

function buildCompactAlphaNumericView(value: string): {
  normalized: string;
  originalIndices: number[];
} {
  let normalized = '';
  const originalIndices: number[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const normalizedChunk = value[i].normalize('NFKC').toLowerCase();
    for (const ch of normalizedChunk) {
      if (isAlphaNumeric(ch)) {
        normalized += ch;
        originalIndices.push(i);
      }
    }
  }

  return { normalized, originalIndices };
}

function findAnchoredAlphaNumericMatch(
  haystack: ReturnType<typeof buildCompactAlphaNumericView>,
  needle: string
): { index: number; length: number } | null {
  if (needle.length < 40) return null;

  const anchorLength = Math.min(40, Math.max(12, Math.floor(needle.length * 0.18)));
  const startAnchor = needle.slice(0, anchorLength);
  const endAnchor = needle.slice(-anchorLength);
  let startPos = haystack.normalized.indexOf(startAnchor);

  while (startPos !== -1) {
    const endPos = haystack.normalized.indexOf(endAnchor, startPos + anchorLength);
    if (endPos !== -1) {
      const spanLength = endPos + anchorLength - startPos;
      if (spanLength <= needle.length * 4) {
        const originalStart = haystack.originalIndices[startPos];
        const originalEnd = haystack.originalIndices[endPos + anchorLength - 1];
        if (typeof originalStart === 'number' && typeof originalEnd === 'number') {
          return {
            index: originalStart,
            length: originalEnd - originalStart + 1,
          };
        }
      }
    }
    startPos = haystack.normalized.indexOf(startAnchor, startPos + 1);
  }

  return null;
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

  const ranges: Range[] = [];
  const rangeInfos: HighlightRangeInfo[] = [];

  // Build combined text map for cross-node matching
  const { combinedText, charMap } = buildTextMap(container, true);
  const normalizedCombinedText = normalizeWhitespace(combinedText);
  const normalizedAlphaCombined = buildNormalizedAlphaNumericView(combinedText);
  const compactAlphaCombined = buildCompactAlphaNumericView(combinedText);

  logHighlightDebug('ApplyStart', {
    highlightCount: highlights.length,
    combinedLength: combinedText.length,
    combinedPreview: previewText(combinedText, 240),
  });

  for (const highlight of highlights) {
    const searchText = highlight.content.trim();
    if (!searchText || searchText.length < 3) continue;

    // Find match in combined text (handles cross-node matches).
    // If exact match fails, fallback to whitespace-tolerant matching so
    // newlines/paragraph separators in selection text still resolve.
    let index = combinedText.indexOf(searchText);
    let matchLength = searchText.length;
    let matchStrategy = 'exact';
    if (index === -1) {
      const fallbackMatch = findWhitespaceTolerantMatch(combinedText, searchText);
      if (fallbackMatch) {
        index = fallbackMatch.index;
        matchLength = fallbackMatch.length;
        matchStrategy = 'whitespace';
        logHighlightDebug('WhitespaceFallbackMatch', {
          highlightId: highlight.id,
          searchLength: searchText.length,
          matchIndex: index,
          matchLength,
          searchPreview: previewText(searchText),
          matchedPreview: previewText(combinedText.slice(index, index + matchLength)),
        });
      }
    }
    if (index === -1) {
      const normalizedAlphaSearch = buildNormalizedAlphaNumericView(searchText).normalized;
      if (normalizedAlphaSearch.length >= 3) {
        const alphaIndex = normalizedAlphaCombined.normalized.indexOf(normalizedAlphaSearch);
        if (alphaIndex !== -1) {
          const startOriginal = normalizedAlphaCombined.originalIndices[alphaIndex];
          const endOriginal =
            normalizedAlphaCombined.originalIndices[
              alphaIndex + normalizedAlphaSearch.length - 1
            ];
          if (typeof startOriginal === 'number' && typeof endOriginal === 'number') {
            index = startOriginal;
            matchLength = endOriginal - startOriginal + 1;
            matchStrategy = 'alnum';
            logHighlightDebug('AlphaNumericFallbackMatch', {
              highlightId: highlight.id,
              searchLength: searchText.length,
              normalizedSearchLength: normalizedAlphaSearch.length,
              matchIndex: index,
              matchLength,
              searchPreview: previewText(searchText),
              normalizedSearchPreview: previewText(normalizedAlphaSearch),
            });
          }
        }
      }
    }
    if (index === -1) {
      const compactAlphaSearch = buildCompactAlphaNumericView(searchText).normalized;
      const anchoredMatch = findAnchoredAlphaNumericMatch(
        compactAlphaCombined,
        compactAlphaSearch
      );
      if (anchoredMatch) {
        index = anchoredMatch.index;
        matchLength = anchoredMatch.length;
        matchStrategy = 'anchored-alnum';
        logHighlightDebug('AnchoredAlphaFallbackMatch', {
          highlightId: highlight.id,
          searchLength: searchText.length,
          normalizedSearchLength: compactAlphaSearch.length,
          matchIndex: index,
          matchLength,
          searchPreview: previewText(searchText),
          normalizedSearchPreview: previewText(compactAlphaSearch),
        });
      }
    }

    if (index !== -1) {
      const range = createCrossNodeRange(charMap, index, matchLength);
      if (range) {
        ranges.push(range);
        rangeInfos.push({ highlight, range });
        logHighlightDebug('MatchApplied', {
          highlightId: highlight.id,
          strategy: matchStrategy,
          matchIndex: index,
          matchLength,
        });
      }
    } else {
      const normalizedSearch = normalizeWhitespace(searchText);
      const normalizedAlphaSearch = buildNormalizedAlphaNumericView(searchText).normalized;
      const compactAlphaSearch = buildCompactAlphaNumericView(searchText).normalized;
      logHighlightDebug('NoMatch', {
        highlightId: highlight.id,
        searchLength: searchText.length,
        normalizedSearchLength: normalizedSearch.length,
        normalizedSearchFound: normalizedCombinedText.includes(normalizedSearch),
        normalizedAlphaSearchLength: normalizedAlphaSearch.length,
        normalizedAlphaSearchFound:
          normalizedAlphaSearch.length > 0 &&
          normalizedAlphaCombined.normalized.includes(normalizedAlphaSearch),
        compactAlphaSearchLength: compactAlphaSearch.length,
        compactAlphaSearchFound:
          compactAlphaSearch.length > 0 &&
          compactAlphaCombined.normalized.includes(compactAlphaSearch),
        searchPreview: previewText(searchText),
        normalizedSearchPreview: previewText(normalizedSearch),
        normalizedAlphaSearchPreview: previewText(normalizedAlphaSearch),
        compactAlphaSearchPreview: previewText(compactAlphaSearch),
      });
    }
  }

  if (ranges.length > 0) {
    // Create a Highlight object and register it
    const windowWithHighlight = window as WindowWithHighlightCtor;
    const cssWithHighlights = CSS as typeof CSS & {
      highlights: CSSHighlightsRegistry;
    };
    const cssHighlight = new windowWithHighlight.Highlight(...ranges);
    cssWithHighlights.highlights.set('nostr-highlights', cssHighlight);
  }

  // Return cleanup function and range infos
  return {
    cleanup: () => {
      if ('highlights' in CSS) {
        const cssWithHighlights = CSS as typeof CSS & {
          highlights: CSSHighlightsRegistry;
        };
        cssWithHighlights.highlights.delete('nostr-highlights');
      }
    },
    rangeInfos,
  };
}

export default function HighlightPlugin({
  source,
  highlights = [],
  onHighlightDeleted,
  onHighlightCreated,
  scrollToHighlightId,
  onScrollToHighlightSettled,
}: HighlightPluginProps) {
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
  const settledScrollHighlightIdRef = useRef<string | null>(null);

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

    let frameId: number | null = null;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

    const applyWhenReady = () => {
      if (cancelled) return;

      const rootElement = editor.getRootElement();
      if (!rootElement) {
        if (attempts < maxAttempts) {
          attempts += 1;
          frameId = requestAnimationFrame(applyWhenReady);
        }
        return;
      }

      // Lexical content can arrive shortly after mount. Retry on the next frames
      // until we have text content or we hit the retry cap.
      const hasRenderableContent = (rootElement.textContent?.length ?? 0) > 0;
      if (!hasRenderableContent && attempts < maxAttempts) {
        attempts += 1;
        frameId = requestAnimationFrame(applyWhenReady);
        return;
      }

      // Clean up previous highlights
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      // Apply new highlights using CSS Highlight API
      const { cleanup, rangeInfos } = applyHighlightsWithCSS(rootElement, highlights);
      cleanupRef.current = cleanup;
      rangeInfosRef.current = rangeInfos;

      let didScrollToTarget = false;
      if (scrollToHighlightId) {
        const target = rangeInfos.find((info) => info.highlight.id === scrollToHighlightId);
        if (target) {
          const scrollTarget =
            target.range.startContainer instanceof Element
              ? target.range.startContainer
              : target.range.startContainer.parentElement;
          const tryScroll = (remainingAttempts: number) => {
            if (!scrollTarget || cancelled) return;
            scrollTarget.scrollIntoView({
              block: 'center',
              behavior: 'auto',
            });

            const rect = target.range.getBoundingClientRect();
            const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

            if (!isVisible && remainingAttempts > 0) {
              frameId = requestAnimationFrame(() => tryScroll(remainingAttempts - 1));
              return;
            }
          };

          tryScroll(8);
          didScrollToTarget = true;
          logHighlightDebug('AutoScrollToHighlight', {
            highlightId: scrollToHighlightId,
            matched: true,
          });
        } else {
          logHighlightDebug('AutoScrollToHighlight', {
            highlightId: scrollToHighlightId,
            matched: false,
          });
        }
      }

      // If a target highlight was requested but couldn't be matched yet, retry
      // for a few frames before giving up.
      const shouldRetry =
        scrollToHighlightId &&
        !didScrollToTarget &&
        attempts < maxAttempts;

      if (shouldRetry) {
        attempts += 1;
        frameId = requestAnimationFrame(applyWhenReady);
        return;
      }

      if (
        scrollToHighlightId &&
        settledScrollHighlightIdRef.current !== scrollToHighlightId
      ) {
        settledScrollHighlightIdRef.current = scrollToHighlightId;
        onScrollToHighlightSettled?.(didScrollToTarget);
      }
    };

    applyWhenReady();

    return () => {
      cancelled = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      rangeInfosRef.current = [];
      settledScrollHighlightIdRef.current = null;
    };
  }, [
    editor,
    isEditable,
    highlights,
    scrollToHighlightId,
    onScrollToHighlightSettled,
  ]);

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
  }, [clickedHighlight, relays, isDeleting, onHighlightDeleted, secretKey]);

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
      logHighlightDebug('CreateHighlight', {
        sourceIdentifier: source.identifier,
        selectedTextLength: selectedText.length,
        selectedTextPreview: previewText(selectedText),
        selectedTextRaw: selectedText,
      });

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
  }, [source, selectedText, context, relays, isPublishing, onHighlightCreated, secretKey]);

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
