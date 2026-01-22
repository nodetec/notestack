'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, isHTMLElement } from 'lexical';
import { $isCodeNode, CodeNode } from '@lexical/code';

const GUTTER_WIDTH = 40;
const ACTION_SIZE = 24;
const GUTTER_FALLBACK_WIDTH = 40;
const INDICATOR_OFFSET = 32;

interface ActionPosition {
  top: number;
  left: number;
  nodeKey: string;
  useFixedPosition: boolean;
  gutterLeft: number;
  gutterTop: number;
  gutterWidth: number;
  gutterHeight: number;
}

export default function CodeGutterActionsPlugin() {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState<ActionPosition | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeSetRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) {
        setPortalTarget(null);
        setRootElement(null);
        return;
      }

      const scrollContainer = rootElement.closest<HTMLElement>('[data-editor-scroll-container]');
      setPortalTarget(scrollContainer ?? document.body);
      setRootElement(rootElement);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'created') {
              codeSetRef.current.add(key);
            } else if (type === 'destroyed') {
              codeSetRef.current.delete(key);
            }
          }
        });
        setShouldListenMouseMove(codeSetRef.current.size > 0);
      },
      { skipInitialization: false },
    );
  }, [editor]);

  const updateFromMouseEvent = useCallback(
    (event: MouseEvent) => {
      const target = event.target;
      if (!isHTMLElement(target)) {
        setPosition(null);
        return;
      }

      if (target.closest('.code-gutter-actions')) {
        return;
      }

      const containerRect =
        portalTarget?.getBoundingClientRect() ?? document.documentElement.getBoundingClientRect();
      const rootRect = rootElement?.getBoundingClientRect();
      const rootStyle = rootElement ? window.getComputedStyle(rootElement) : null;
      const paddingLeft = Number.parseFloat(rootStyle?.paddingLeft || '0') || GUTTER_FALLBACK_WIDTH;
      const gutterLeftViewport = containerRect.left;
      const gutterRightViewport = (rootRect?.left ?? containerRect.left) + paddingLeft;
      const isInGutter =
        event.clientX >= gutterLeftViewport &&
        event.clientX <= gutterRightViewport &&
        event.clientY >= containerRect.top &&
        event.clientY <= containerRect.bottom;

      if (!isInGutter) {
        setPosition(null);
        return;
      }

      const y = event.clientY;
      let closest: { key: string; rect: DOMRect; distance: number } | null = null;

      codeSetRef.current.forEach((key) => {
        const element = editor.getElementByKey(key);
        if (!element) {
          return;
        }
        const elementRect = element.getBoundingClientRect();
        let distance = 0;
        if (y < elementRect.top) {
          distance = elementRect.top - y;
        } else if (y > elementRect.bottom) {
          distance = y - elementRect.bottom;
        }

        if (!closest || distance < closest.distance) {
          closest = { key, rect: elementRect, distance };
        }
      });

      if (!closest) {
        setPosition(null);
        return;
      }

      const rect = closest.rect;
      const codeElement = editor.getElementByKey(closest.key);
      if (!codeElement) {
        setPosition(null);
        return;
      }

      const nodeKey = closest.key;

      const computedStyle = window.getComputedStyle(codeElement);
      const paddingTop = Number.parseFloat(computedStyle.paddingTop || '0');
      const lineHeight = Number.parseFloat(computedStyle.lineHeight || '0') || ACTION_SIZE;
      const topOffset = paddingTop + Math.max(0, (lineHeight - ACTION_SIZE) / 2);

      const useFixedPosition = portalTarget === null || portalTarget === document.body;
      const gutterWidth = Math.max(0, gutterRightViewport - gutterLeftViewport);
      const leftOffset = rect.left - INDICATOR_OFFSET;
      if (useFixedPosition) {
        setPosition({
          top: rect.top + topOffset,
          left: leftOffset,
          nodeKey,
          useFixedPosition,
          gutterLeft: gutterLeftViewport,
          gutterTop: rect.top,
          gutterWidth,
          gutterHeight: rect.height,
        });
        return;
      }

      const scrollContainerRect = portalTarget.getBoundingClientRect();
      const gutterLeft = portalTarget.scrollLeft;
      setPosition({
        top: rect.top - scrollContainerRect.top + portalTarget.scrollTop + topOffset,
        left: rect.left - scrollContainerRect.left + portalTarget.scrollLeft - INDICATOR_OFFSET,
        nodeKey,
        useFixedPosition,
        gutterLeft,
        gutterTop: rect.top - scrollContainerRect.top + portalTarget.scrollTop,
        gutterWidth: Math.max(0, gutterRightViewport - gutterLeftViewport),
        gutterHeight: rect.height,
      });
    },
    [editor, portalTarget, rootElement],
  );

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromMouseEvent(event);
      });
    };

    const handleScroll = () => setPosition(null);
    const target = portalTarget && portalTarget !== document.body ? portalTarget : window;

    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [portalTarget, shouldListenMouseMove, updateFromMouseEvent]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(() => {
    if (!position) {
      return;
    }

    let codeText = '';
    editor.read(() => {
      const node = $getNodeByKey(position.nodeKey);
      if ($isCodeNode(node)) {
        codeText = node.getTextContent();
      }
    });

    if (!codeText) {
      return;
    }

    void navigator.clipboard.writeText(codeText);
    setCopied(true);
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = setTimeout(() => {
      setCopied(false);
    }, 1200);
  }, [editor, position]);

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <div
      className="code-gutter-actions z-50"
      style={{
        position: position.useFixedPosition ? 'fixed' : 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <button
        type="button"
        className="relative flex size-6 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        onClick={handleCopy}
        aria-label="Copy code block"
      >
        <CopyIcon
          className={`size-4 transition-all duration-200 ${copied ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}
        />
        <CheckIcon
          className={`absolute size-4 text-emerald-500 transition-all duration-200 ${copied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        />
      </button>
    </div>,
    portalTarget ?? document.body
  );
}
