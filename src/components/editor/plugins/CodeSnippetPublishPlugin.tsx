'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CodeIcon } from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode, $getNodeByKey } from 'lexical';
import { $isCodeNode } from '@lexical/code';
import CodeSnippetDialog from '../toolbar/CodeSnippetDialog';

const BUTTON_SIZE = 28;
const BUTTON_OFFSET = 8;

interface ActionPosition {
  top: number;
  left: number;
  useFixedPosition: boolean;
}

export default function CodeSnippetPublishPlugin() {
  const [editor] = useLexicalComposerContext();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [position, setPosition] = useState<ActionPosition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCode, setDialogCode] = useState('');
  const [dialogLanguage, setDialogLanguage] = useState<string | undefined>(undefined);
  const hoveredElementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return editor.registerRootListener((root) => {
      if (!root) {
        setPortalTarget(null);
        setRootElement(null);
        return;
      }
      const scrollContainer = root.closest<HTMLElement>('[data-editor-scroll-container]');
      setPortalTarget(scrollContainer ?? document.body);
      setRootElement(root);
    });
  }, [editor]);

  const updatePosition = useCallback(
    (element: HTMLElement) => {
      if (!portalTarget) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const useFixedPosition = portalTarget === document.body;
      if (useFixedPosition) {
        setPosition({
          top: rect.top + BUTTON_OFFSET,
          left: rect.right - BUTTON_OFFSET - BUTTON_SIZE,
          useFixedPosition,
        });
        return;
      }

      const containerRect = portalTarget.getBoundingClientRect();
      setPosition({
        top: rect.top - containerRect.top + portalTarget.scrollTop + BUTTON_OFFSET,
        left: rect.right - containerRect.left + portalTarget.scrollLeft - BUTTON_OFFSET - BUTTON_SIZE,
        useFixedPosition,
      });
    },
    [portalTarget]
  );

  const clearHover = useCallback(() => {
    hoveredElementRef.current = null;
    setHoveredKey(null);
    setPosition(null);
  }, []);

  const updateHoverFromEvent = useCallback(
    (event: MouseEvent) => {
      if (!rootElement) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest('.code-snippet-action')) {
        return;
      }
      const candidate = target?.closest('code') as HTMLElement | null;
      if (!candidate || !rootElement.contains(candidate)) {
        clearHover();
        return;
      }

      editor.read(() => {
        const node = $getNearestNodeFromDOMNode(candidate);
        if (!$isCodeNode(node)) {
          clearHover();
          return;
        }
        const key = node.getKey();
        hoveredElementRef.current = candidate;
        setHoveredKey(key);
        updatePosition(candidate);
      });
    },
    [editor, rootElement, updatePosition, clearHover]
  );

  useEffect(() => {
    if (!rootElement) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateHoverFromEvent(event);
      });
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const nextTarget = event.relatedTarget as HTMLElement | null;
      if (nextTarget?.closest('.code-snippet-action')) {
        return;
      }
      clearHover();
    };

    rootElement.addEventListener('mousemove', handleMouseMove);
    rootElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      rootElement.removeEventListener('mousemove', handleMouseMove);
      rootElement.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [rootElement, updateHoverFromEvent, clearHover]);

  useEffect(() => {
    if (!portalTarget) {
      return;
    }

    const handleScroll = () => {
      if (hoveredElementRef.current) {
        updatePosition(hoveredElementRef.current);
      }
    };

    const handleResize = () => {
      if (hoveredElementRef.current) {
        updatePosition(hoveredElementRef.current);
      }
    };

    const target = portalTarget === document.body ? window : portalTarget;
    target.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      target.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [portalTarget, updatePosition]);

  const openDialog = useCallback(() => {
    if (!hoveredKey) {
      return;
    }

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(hoveredKey);
      if ($isCodeNode(node)) {
        setDialogCode(node.getTextContent());
        setDialogLanguage(node.getLanguage() ?? undefined);
      }
    });
    setDialogOpen(true);
  }, [editor, hoveredKey]);

  if (!portalTarget || !position || !hoveredKey) {
    return (
      <CodeSnippetDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        code={dialogCode}
        language={dialogLanguage}
      />
    );
  }

  return createPortal(
    <>
      <div
        className="code-snippet-action pointer-events-auto"
        style={{
          position: position.useFixedPosition ? 'fixed' : 'absolute',
          top: position.top,
          left: position.left,
        }}
      >
        <button
          type="button"
          className="group flex size-7 items-center justify-center rounded-md bg-card/90 text-muted-foreground shadow-sm ring-1 ring-border/70 transition hover:text-foreground hover:ring-border"
          onClick={openDialog}
          aria-label="Publish code snippet"
        >
          <CodeIcon className="size-4" />
        </button>
      </div>
      <CodeSnippetDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        code={dialogCode}
        language={dialogLanguage}
      />
    </>,
    portalTarget
  );
}
