'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
} from 'lucide-react';

const HEADING_ICONS: Record<HeadingTagType, React.ReactNode> = {
  h1: <Heading1Icon className="size-5" />,
  h2: <Heading2Icon className="size-5" />,
  h3: <Heading3Icon className="size-5" />,
  h4: <Heading4Icon className="size-5" />,
  h5: <Heading5Icon className="size-5" />,
  h6: <Heading6Icon className="size-5" />,
};

interface IndicatorPosition {
  top: number;
  left: number;
  tag: HeadingTagType;
  useFixedPosition: boolean;
}

export default function BlockTypeIndicatorPlugin() {
  const [editor] = useLexicalComposerContext();
  const [position, setPosition] = useState<IndicatorPosition | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return editor.registerRootListener((rootElement) => {
      if (!rootElement) {
        setPortalTarget(null);
        return;
      }

      const scrollContainer = rootElement.closest<HTMLElement>('[data-editor-scroll-container]');
      setPortalTarget(scrollContainer ?? document.body);
    });
  }, [editor]);

  const $updateIndicator = useCallback(() => {
    const selection = $getSelection();

    if (selection == null || !$isRangeSelection(selection)) {
      setPosition(null);
      return;
    }

    const anchorNode = selection.anchor.getNode();
    let element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent();
            return parent !== null && $isRootOrShadowRoot(parent);
          });

    if (element === null) {
      element = anchorNode.getTopLevelElementOrThrow();
    }

    if (!$isHeadingNode(element)) {
      setPosition(null);
      return;
    }

    const tag = element.getTag();
    const elementDOM = editor.getElementByKey(element.getKey());

    if (elementDOM === null) {
      setPosition(null);
      return;
    }

    // Get the bounding rect of the heading element (viewport coordinates)
    const rect = elementDOM.getBoundingClientRect();

    const useFixedPosition = portalTarget === null || portalTarget === document.body;
    const indicatorSize = 24;
    const indicatorOffset = 32;
    const computedStyle = window.getComputedStyle(elementDOM);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight || '') || rect.height;
    const bottomAlignedTop = rect.top + Math.min(lineHeight, rect.height) - indicatorSize;

    if (useFixedPosition) {
      const top = bottomAlignedTop;
      const left = rect.left - indicatorOffset;
      setPosition({ top, left, tag, useFixedPosition });
      return;
    }

    const containerRect = portalTarget.getBoundingClientRect();
    const top =
      bottomAlignedTop - containerRect.top + portalTarget.scrollTop;
    const left =
      rect.left - containerRect.left + portalTarget.scrollLeft - indicatorOffset;

    setPosition({ top, left, tag, useFixedPosition });
  }, [editor, portalTarget]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($updateIndicator);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };

    // Initial update
    delayedCallback();

    const handleScroll = () => editor.getEditorState().read($updateIndicator);
    const scrollTarget =
      portalTarget && portalTarget !== document.body ? portalTarget : window;

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        delayedCallback,
        COMMAND_PRIORITY_LOW,
      ),
      () => {
        clearTimeout(timeoutId);
        scrollTarget.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      },
    );
  }, [editor, $updateIndicator, portalTarget]);

  if (!mounted || !position) {
    return null;
  }

  return createPortal(
    <div
      className="z-50 transition-opacity duration-150 ease-out pointer-events-none"
      style={{
        position: position.useFixedPosition ? 'fixed' : 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <div className="flex items-center justify-center size-6 text-zinc-400 dark:text-zinc-500">
        {HEADING_ICONS[position.tag]}
      </div>
    </div>,
    portalTarget ?? document.body
  );
}
