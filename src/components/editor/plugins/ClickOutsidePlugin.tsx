'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $setSelection,
  $createRangeSelection,
  $createNodeSelection,
  $isElementNode,
  $isDecoratorNode,
  $isTextNode,
  $isLineBreakNode,
  $getNodeFromDOMNode,
  type LexicalNode,
} from 'lexical';
import { $isCodeNode, $isCodeHighlightNode } from '@lexical/code';
import { $isQuoteNode } from '@lexical/rich-text';
import { useEffect, useRef } from 'react';

export default function ClickOutsidePlugin() {
  const [editor] = useLexicalComposerContext();
  const editorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    editorRef.current = editor.getRootElement();
  }, [editor]);

  useEffect(() => {
    // Listen on document to catch all clicks, including those on html/body
    const handleClick = (e: MouseEvent) => {
      const editorElement = editorRef.current;
      if (!editorElement) return;

      const target = e.target as HTMLElement;
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Ignore clicks on interactive elements outside the editor (inputs, buttons, etc.)
      if (target.closest('input, button, textarea, select, [role="button"], aside')) {
        return;
      }

      // Check if we clicked inside the editor but to the right of actual content
      // This handles inline decorator nodes (like npub, link) where clicking to their right
      // should place cursor after them
      if (editorElement.contains(target)) {
        // Check if target is a paragraph or similar block element
        const blockElement = target.closest('p, h1, h2, h3, h4, h5, h6, li');
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

      // Use elementFromPoint to find what element is at the click's Y position
      // but at the editor's X position (inside the editor)
      const probeX = editorRect.left + editorRect.width / 2;
      const elementAtPoint = document.elementFromPoint(probeX, clickY);

      if (!elementAtPoint) return;

      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();

        if (children.length === 0) return;

        let targetNode: LexicalNode | null = null;
        let targetDomElement: HTMLElement | null = null;

        // Try to get the Lexical node directly from the DOM element
        // Walk up the DOM tree to find an element that maps to a Lexical node
        let currentElement: Element | null = elementAtPoint;
        while (currentElement && currentElement !== editorElement) {
          const node = $getNodeFromDOMNode(currentElement);
          if (node && ($isElementNode(node) || $isDecoratorNode(node))) {
            targetNode = node;
            targetDomElement = currentElement as HTMLElement;
            break;
          }
          currentElement = currentElement.parentElement;
        }

        // If we didn't find a node, fall back to finding by position among root children
        if (!targetNode) {
          let bestMatch: { node: LexicalNode; rect: DOMRect; domElement: HTMLElement } | null = null;
          let bestDistance = Infinity;

          for (const child of children) {
            const key = child.getKey();
            const domElement = editor.getElementByKey(key);
            if (domElement) {
              const rect = domElement.getBoundingClientRect();

              // Check if click Y is within this element
              if (clickY >= rect.top && clickY <= rect.bottom) {
                bestMatch = { node: child, rect, domElement };
                break;
              }

              // Track closest
              const distance = clickY < rect.top
                ? rect.top - clickY
                : clickY - rect.bottom;

              if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = { node: child, rect, domElement };
              }
            }
          }

          if (bestMatch) {
            targetNode = bestMatch.node;
            targetDomElement = bestMatch.domElement;
          }
        }

        if (!targetNode || !targetDomElement) {
          // Last resort: use the last child
          targetNode = children[children.length - 1];
          targetDomElement = editor.getElementByKey(targetNode.getKey());
        }

        if (!targetNode) return;

        const selection = $createRangeSelection();
        const targetRect = targetDomElement?.getBoundingClientRect();

        // Handle multi-line elements (code blocks and blockquotes) with line-based cursor placement
        if (($isCodeNode(targetNode) || $isQuoteNode(targetNode)) && targetRect) {
          const computedStyle = getComputedStyle(targetDomElement!);
          const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

          // Clamp clickY to be within the element's bounds
          const clampedClickY = Math.max(
            targetRect.top + paddingTop,
            Math.min(clickY, targetRect.bottom)
          );
          const relativeY = clampedClickY - targetRect.top - paddingTop;
          const lineIndex = Math.max(0, Math.floor(relativeY / lineHeight));

          const textContent = targetNode.getTextContent();
          const lines = textContent.split('\n');
          const clampedLineIndex = Math.min(lineIndex, lines.length - 1);

          // Calculate character offset for the target line
          let charOffset = 0;
          for (let i = 0; i < clampedLineIndex; i++) {
            charOffset += lines[i].length + 1;
          }

          const targetLineOffset = isLeftSide
            ? charOffset
            : charOffset + lines[clampedLineIndex].length;

          // Find the position in children (handles both code highlights and regular text)
          const nodeChildren = targetNode.getChildren();
          let currentOffset = 0;
          let foundNode: LexicalNode | null = null;
          let foundOffset = 0;
          let targetLineBreakNode: LexicalNode | null = null;

          for (let i = 0; i < nodeChildren.length; i++) {
            const child = nodeChildren[i];

            if ($isLineBreakNode(child)) {
              if (currentOffset === targetLineOffset) {
                // Remember this line break for empty line handling
                targetLineBreakNode = child;
                if (i > 0) {
                  const prevChild = nodeChildren[i - 1];
                  if ($isTextNode(prevChild) || $isCodeHighlightNode(prevChild)) {
                    foundNode = prevChild;
                    foundOffset = prevChild.getTextContentSize();
                  }
                }
                break;
              }
              currentOffset += 1;
            } else if ($isTextNode(child) || $isCodeHighlightNode(child)) {
              const textLength = child.getTextContentSize();

              if (currentOffset + textLength >= targetLineOffset) {
                foundNode = child;
                foundOffset = targetLineOffset - currentOffset;
                break;
              }
              currentOffset += textLength;
            }
          }

          if (foundNode && ($isTextNode(foundNode) || $isCodeHighlightNode(foundNode))) {
            selection.anchor.set(foundNode.getKey(), foundOffset, 'text');
            selection.focus.set(foundNode.getKey(), foundOffset, 'text');
          } else if (targetLineBreakNode) {
            // Empty line case: select at the line break position using element selection
            const lineBreakIndex = targetLineBreakNode.getIndexWithinParent();
            selection.anchor.set(targetNode.getKey(), lineBreakIndex, 'element');
            selection.focus.set(targetNode.getKey(), lineBreakIndex, 'element');
          } else {
            // Fallback to first/last text child
            const textChildren = nodeChildren.filter(
              (c) => $isTextNode(c) || $isCodeHighlightNode(c)
            );
            if (textChildren.length > 0) {
              if (isLeftSide) {
                const first = textChildren[0];
                selection.anchor.set(first.getKey(), 0, 'text');
                selection.focus.set(first.getKey(), 0, 'text');
              } else {
                const last = textChildren[textChildren.length - 1];
                const len = last.getTextContentSize();
                selection.anchor.set(last.getKey(), len, 'text');
                selection.focus.set(last.getKey(), len, 'text');
              }
            } else {
              selection.anchor.set(targetNode.getKey(), 0, 'element');
              selection.focus.set(targetNode.getKey(), 0, 'element');
            }
          }
        } else if ($isDecoratorNode(targetNode)) {
          // For decorator nodes (like images, links), place cursor before or after
          const parent = targetNode.getParent();
          if (parent && $isElementNode(parent)) {
            const index = targetNode.getIndexWithinParent();
            if (isLeftSide) {
              // Place cursor before the decorator node
              selection.anchor.set(parent.getKey(), index, 'element');
              selection.focus.set(parent.getKey(), index, 'element');
            } else {
              // Place cursor after the decorator node
              selection.anchor.set(parent.getKey(), index + 1, 'element');
              selection.focus.set(parent.getKey(), index + 1, 'element');
            }
          } else {
            // Fallback: select the node
            const nodeSelection = $createNodeSelection();
            nodeSelection.add(targetNode.getKey());
            $setSelection(nodeSelection);
            editorElement.focus({ preventScroll: true });
            return;
          }
        } else if ($isElementNode(targetNode)) {
          if (isLeftSide) {
            const firstChild = targetNode.getFirstChild();
            if (firstChild && $isTextNode(firstChild)) {
              selection.anchor.set(firstChild.getKey(), 0, 'text');
              selection.focus.set(firstChild.getKey(), 0, 'text');
            } else {
              selection.anchor.set(targetNode.getKey(), 0, 'element');
              selection.focus.set(targetNode.getKey(), 0, 'element');
            }
          } else {
            const lastChild = targetNode.getLastChild();
            if (lastChild && $isTextNode(lastChild)) {
              const textLength = lastChild.getTextContentSize();
              selection.anchor.set(lastChild.getKey(), textLength, 'text');
              selection.focus.set(lastChild.getKey(), textLength, 'text');
            } else if (lastChild && $isDecoratorNode(lastChild)) {
              // For decorator nodes, use selectNext to place cursor after
              lastChild.selectNext(0, 0);
              editorElement.focus({ preventScroll: true });
              return;
            } else if (lastChild && $isElementNode(lastChild)) {
              selection.anchor.set(lastChild.getKey(), lastChild.getChildrenSize(), 'element');
              selection.focus.set(lastChild.getKey(), lastChild.getChildrenSize(), 'element');
            } else {
              selection.anchor.set(targetNode.getKey(), targetNode.getChildrenSize(), 'element');
              selection.focus.set(targetNode.getKey(), targetNode.getChildrenSize(), 'element');
            }
          }
        }

        $setSelection(selection);
        // Focus without scrolling
        editorElement.focus({ preventScroll: true });
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [editor]);

  return null;
}
