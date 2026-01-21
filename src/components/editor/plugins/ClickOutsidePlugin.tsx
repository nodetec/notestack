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
        if ('caretPositionFromPoint' in document) {
          const position = document.caretPositionFromPoint(x, y);
          if (!position) return null;
          const range = document.createRange();
          range.setStart(position.offsetNode, position.offset);
          range.collapse(true);
          return range;
        }
        if ('caretRangeFromPoint' in document) {
          return document.caretRangeFromPoint(x, y);
        }
        return null;
      };
      const probeX = editorRect.left + editorRect.width / 2;
      const range = getCaretRangeFromPoint(probeX, clickY);
      if (!range || !editorElement.contains(range.startContainer)) return;

      e.preventDefault();
      editor.update(() => {
        const nearestNode = $getNearestNodeFromDOMNode(range.startContainer);
        if (nearestNode && $isDecoratorNode(nearestNode)) {
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

        const domSelection = window.getSelection();
        domSelection?.removeAllRanges();
        domSelection?.addRange(range);
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
