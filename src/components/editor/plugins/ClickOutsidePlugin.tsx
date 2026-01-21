'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelectionFromDom,
  $createRangeSelection,
  $getNearestNodeFromDOMNode,
  $setSelection,
  $isDecoratorNode,
  $isElementNode,
  $getNodeFromDOMNode,
} from 'lexical';
import { useEffect, useRef } from 'react';

export default function ClickOutsidePlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      editorRef.current = rootElement;
    });
  }, [editor]);

  useEffect(() => {
    // Listen on document to catch all clicks, including those on html/body
    const handleClick = (e: PointerEvent) => {
      const editorElement = editorRef.current;
      if (!editorElement) return;

      const target = e.target;
      if (!(target instanceof Element)) return;

      const targetElement = target as HTMLElement;
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Ignore clicks on interactive elements outside the editor (inputs, buttons, popovers, etc.)
      if (targetElement.closest(
        'input, button, textarea, select, [role="button"], [role="dialog"], [data-radix-popper-content-wrapper], [data-radix-portal], aside'
      )) {
        return;
      }

      // Check if we clicked inside the editor but to the right of actual content
      // This handles inline decorator nodes (like npub, link) where clicking to their right
      // should place cursor after them
      if (editorElement.contains(targetElement)) {
        // Check if target is a paragraph or similar block element
        const blockElement = targetElement.closest('p, h1, h2, h3, h4, h5, h6, li');
        if (blockElement && editorElement.contains(blockElement)) {
          // Find all decorator nodes in this block - check both attribute formats
          let decoratorSpans = blockElement.querySelectorAll('[data-lexical-decorator="true"]');
          if (decoratorSpans.length === 0) {
            decoratorSpans = blockElement.querySelectorAll('[data-lexical-decorator]');
          }

          // Find the rightmost decorator that's on the same line as the click
          let rightmostDecorator: Element | null = null;
          let rightmostDecoratorRight = 0;

          for (let i = 0; i < decoratorSpans.length; i++) {
            const span = decoratorSpans[i];
            const rect = span.getBoundingClientRect();

            // Check if this decorator is on the same line as the click (within vertical bounds)
            if (clickY >= rect.top && clickY <= rect.bottom) {
              if (rect.right > rightmostDecoratorRight) {
                rightmostDecoratorRight = rect.right;
                rightmostDecorator = span;
              }
            }
          }

          // If we found a decorator and the click is to its right
          if (rightmostDecorator && clickX > rightmostDecoratorRight + 2) {
            // Check if there's any text content after this decorator
            const decoratorRect = rightmostDecorator.getBoundingClientRect();

            // Walk through all content to find if there's text after the decorator
            const walker = document.createTreeWalker(
              blockElement,
              NodeFilter.SHOW_TEXT,
              null
            );

            let hasTextAfterDecorator = false;
            let textNode: Text | null;
            while ((textNode = walker.nextNode() as Text | null)) {
              if (textNode.textContent?.trim()) {
                const range = document.createRange();
                range.selectNodeContents(textNode);
                const rects = range.getClientRects();
                for (let i = 0; i < rects.length; i++) {
                  // If there's text to the right of the decorator on the same line
                  if (rects[i].left >= decoratorRect.right - 2 &&
                      clickY >= rects[i].top && clickY <= rects[i].bottom) {
                    hasTextAfterDecorator = true;
                    break;
                  }
                }
              }
              if (hasTextAfterDecorator) break;
            }

            // Only handle if the decorator is the last thing on the line
            if (!hasTextAfterDecorator) {
              editor.update(() => {
                const node = $getNodeFromDOMNode(rightmostDecorator!);
                if (node && $isDecoratorNode(node)) {
                  // Use selectNext to place cursor after the decorator
                  node.selectNext(0, 0);
                  editorElement.focus({ preventScroll: true });
                }
              });
              return;
            }
          }
        }

        // Let default behavior handle other clicks inside editor
        return;
      }

      const editorRect = editorElement.getBoundingClientRect();

      // Check if click is within the vertical bounds of the editor
      if (clickY < editorRect.top || clickY > editorRect.bottom) {
        return;
      }

      // Determine if click is to the left or right of the editor
      const isLeftSide = clickX < editorRect.left;
      const isRightSide = clickX > editorRect.right;

      if (!isLeftSide && !isRightSide) return;

      const getCaretRangeFromPoint = (x: number, y: number) => {
        const doc = document as Document & {
          caretRangeFromPoint?: (x: number, y: number) => Range | null;
          caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null;
        };
        if (typeof doc.caretPositionFromPoint === 'function') {
          const position = doc.caretPositionFromPoint(x, y);
          if (!position) return null;
          const range = document.createRange();
          const { offsetNode, offset } = position;
          if (offsetNode.nodeType === Node.ELEMENT_NODE) {
            const element = offsetNode as Element;
            const clampedOffset = Math.min(offset, element.childNodes.length);
            range.setStart(element, clampedOffset);
          } else if (offsetNode.nodeType === Node.TEXT_NODE) {
            const text = offsetNode as Text;
            const clampedOffset = Math.min(offset, text.data.length);
            range.setStart(text, clampedOffset);
          } else {
            range.setStart(offsetNode, 0);
          }
          range.collapse(true);
          return range;
        }
        if (typeof doc.caretRangeFromPoint === 'function') {
          return doc.caretRangeFromPoint(x, y);
        }
        return null;
      };
      const probeXCenter = editorRect.left + editorRect.width / 2;
      const elementAtPoint = document.elementFromPoint(probeXCenter, clickY);
      const blockElement = elementAtPoint?.closest('p, h1, h2, h3, h4, h5, h6, li');
      let lineRect: DOMRect | null = null;
      if (blockElement && editorElement.contains(blockElement)) {
        const lineRange = document.createRange();
        lineRange.selectNodeContents(blockElement);
        const rects = Array.from(lineRange.getClientRects());
        lineRect = rects.find((rect) => clickY >= rect.top && clickY <= rect.bottom) ?? null;
      }

      const probeX = lineRect
        ? (isLeftSide ? lineRect.left + 1 : lineRect.right - 1)
        : probeXCenter;
      const range = getCaretRangeFromPoint(probeX, clickY);
      if (!range || !editorElement.contains(range.startContainer)) return;

      e.preventDefault();
      editor.update(() => {
        const nearestNode = $getNearestNodeFromDOMNode(range.startContainer);
        if (nearestNode && $isDecoratorNode(nearestNode)) {
          const decoratorElement = editor.getElementByKey(nearestNode.getKey());
          const decoratorRect = decoratorElement?.getBoundingClientRect();
          let isLineBoundary = true;
          if (decoratorElement && decoratorRect) {
            const blockElement = decoratorElement.closest('p, h1, h2, h3, h4, h5, h6, li');
            if (blockElement) {
              const walker = document.createTreeWalker(
                blockElement,
                NodeFilter.SHOW_TEXT,
                null
              );
              let textNode: Text | null;
              while ((textNode = walker.nextNode() as Text | null)) {
                if (!textNode.textContent?.trim()) continue;
                const textRange = document.createRange();
                textRange.selectNodeContents(textNode);
                const rects = textRange.getClientRects();
                for (let i = 0; i < rects.length; i++) {
                  const rect = rects[i];
                  const overlapsLine =
                    rect.top <= decoratorRect.bottom &&
                    rect.bottom >= decoratorRect.top;
                  if (!overlapsLine) continue;
                  const hasTextBefore = rect.right <= decoratorRect.left + 1;
                  const hasTextAfter = rect.left >= decoratorRect.right - 1;
                  if (isLeftSide && hasTextBefore) {
                    isLineBoundary = false;
                    break;
                  }
                  if (isRightSide && hasTextAfter) {
                    isLineBoundary = false;
                    break;
                  }
                }
                if (!isLineBoundary) break;
              }
            }
          }

          if (isLineBoundary) {
            const parent = nearestNode.getParent();
            if (parent && $isElementNode(parent)) {
              const selection = $createRangeSelection();
              const index = nearestNode.getIndexWithinParent();
              const offset = isLeftSide ? index : index + 1;
              selection.anchor.set(parent.getKey(), offset, 'element');
              selection.focus.set(parent.getKey(), offset, 'element');
              $setSelection(selection);
              editorElement.focus({ preventScroll: true });
              return;
            }
          }
        }

        const domSelection = window.getSelection();
        domSelection?.removeAllRanges();
        let selectionRange = range;
        if (nearestNode && $isDecoratorNode(nearestNode) && lineRect && decoratorRect) {
          let alternateX = isLeftSide
            ? decoratorRect.left - 2
            : decoratorRect.right + 2;
          const minX = lineRect.left + 1;
          const maxX = lineRect.right - 1;
          if (alternateX < minX || alternateX > maxX) {
            alternateX = isLeftSide ? minX : maxX;
          }
          const alternateRange = getCaretRangeFromPoint(alternateX, clickY);
          if (
            alternateRange &&
            editorElement.contains(alternateRange.startContainer)
          ) {
            selectionRange = alternateRange;
          }
        }

        domSelection?.addRange(selectionRange);
        if (domSelection && typeof domSelection.modify === 'function') {
          domSelection.modify(
            'move',
            isLeftSide ? 'backward' : 'forward',
            'lineboundary'
          );
        }

        const nextSelection = $createRangeSelectionFromDom(domSelection, editor);
        if (nextSelection) {
          $setSelection(nextSelection);
          editorElement.focus({ preventScroll: true });
        }
      });
      return;
    };

    const listenerOptions = { capture: true } as const;
    document.addEventListener('pointerdown', handleClick, listenerOptions);
    return () => document.removeEventListener('pointerdown', handleClick, listenerOptions);
  }, [editor]);

  return null;
}
