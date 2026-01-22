'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
} from 'lucide-react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $getNodeByKey,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { $isHeadingNode, HeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $isCodeNode, CodeNode } from '@lexical/code';

const HEADING_ACTION_SIZE = 20;
const HEADING_ACTION_OFFSET = 32;
const HEADING_SLOT_GAP = 20;
const CODE_ACTION_SIZE = 24;
const CODE_ACTION_OFFSET = 32;
const GUTTER_FALLBACK_WIDTH = 40;

interface ActionPosition {
  top: number;
  left: number;
  useFixedPosition: boolean;
}

interface HeadingPosition extends ActionPosition {
  headingKey: string;
}

interface CodePosition extends ActionPosition {
  nodeKey: string;
}

interface ActiveHeadingIndicator extends ActionPosition {
  headingKey: string;
  tag: HeadingTagType;
}

const HEADING_ICONS: Record<HeadingTagType, React.ReactNode> = {
  h1: <Heading1Icon className="size-4" />,
  h2: <Heading2Icon className="size-4" />,
  h3: <Heading3Icon className="size-4" />,
  h4: <Heading4Icon className="size-4" />,
  h5: <Heading5Icon className="size-4" />,
  h6: <Heading6Icon className="size-4" />,
};

export default function GutterActionsPlugin() {
  const [editor] = useLexicalComposerContext();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [headingPositions, setHeadingPositions] = useState<HeadingPosition[]>([]);
  const [headingRenderPositions, setHeadingRenderPositions] = useState<HeadingPosition[]>([]);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [activeHeading, setActiveHeading] = useState<ActiveHeadingIndicator | null>(null);
  const [activeHeadingRender, setActiveHeadingRender] = useState<ActiveHeadingIndicator | null>(
    null,
  );
  const [activeHeadingVisible, setActiveHeadingVisible] = useState(false);
  const [codePosition, setCodePosition] = useState<CodePosition | null>(null);
  const [codeRenderPosition, setCodeRenderPosition] = useState<CodePosition | null>(null);
  const [codeVisible, setCodeVisible] = useState(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState(false);
  const lastMouseEventRef = useRef<MouseEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const headingKeysRef = useRef<Set<string>>(new Set());
  const codeKeysRef = useRef<Set<string>>(new Set());
  const collapsedKeysRef = useRef<Set<string>>(new Set());
  const hiddenKeysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideHeadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideActiveHeadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideCodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeHeadingKeyRef = useRef<string | null>(null);
  const selectionRafRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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


  useEffect(() => {
    return editor.registerMutationListener(
      HeadingNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'created') {
              headingKeysRef.current.add(key);
            } else if (type === 'destroyed') {
              headingKeysRef.current.delete(key);
              collapsedKeysRef.current.delete(key);
            }
          }
        });
        setShouldListenMouseMove(
          headingKeysRef.current.size > 0 || codeKeysRef.current.size > 0,
        );
        applyCollapsedState();
      },
      { skipInitialization: false },
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'created') {
              codeKeysRef.current.add(key);
            } else if (type === 'destroyed') {
              codeKeysRef.current.delete(key);
            }
          }
        });
        setShouldListenMouseMove(
          headingKeysRef.current.size > 0 || codeKeysRef.current.size > 0,
        );
      },
      { skipInitialization: false },
    );
  }, [editor]);

  const applyCollapsedState = useCallback(() => {
    const nextHiddenKeys = new Set<string>();

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      const collapsedStack: Array<{ level: number }> = [];

      for (const node of children) {
        const isHeading = $isHeadingNode(node);

        if (isHeading) {
          const level = Number.parseInt(node.getTag().slice(1), 10);
          while (collapsedStack.length && level <= collapsedStack[collapsedStack.length - 1].level) {
            collapsedStack.pop();
          }
        }

        const isHidden = collapsedStack.length > 0;
        if (isHidden) {
          nextHiddenKeys.add(node.getKey());
        }

        if (isHeading && !isHidden && collapsedKeysRef.current.has(node.getKey())) {
          const level = Number.parseInt(node.getTag().slice(1), 10);
          collapsedStack.push({ level });
        }
      }
    });

    const prevHidden = hiddenKeysRef.current;
    prevHidden.forEach((key) => {
      if (!nextHiddenKeys.has(key)) {
        const element = editor.getElementByKey(key);
        if (element) {
          element.style.display = '';
          element.removeAttribute('data-collapsed');
        }
      }
    });

    nextHiddenKeys.forEach((key) => {
      const element = editor.getElementByKey(key);
      if (element) {
        element.style.display = 'none';
        element.setAttribute('data-collapsed', 'true');
      }
    });

    hiddenKeysRef.current = nextHiddenKeys;
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      applyCollapsedState();
    });
  }, [editor, applyCollapsedState]);

  const updateActiveHeadingIndicator = useCallback(() => {
    let nextActive: { key: string; tag: HeadingTagType } | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root'
          ? null
          : anchorNode.getTopLevelElementOrThrow();
        if (element && $isHeadingNode(element)) {
          nextActive = { key: element.getKey(), tag: element.getTag() };
        }
      }
    });

    activeHeadingKeyRef.current = nextActive?.key ?? null;

    if (!nextActive) {
      setActiveHeading(null);
      return;
    }

    const element = editor.getElementByKey(nextActive.key);
    if (!element || element.style.display === 'none') {
      setActiveHeading(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(computedStyle.lineHeight || '0') || HEADING_ACTION_SIZE;
    const topOffset = Math.max(0, (lineHeight - HEADING_ACTION_SIZE) / 2);
    const offset = HEADING_ACTION_OFFSET;
    const useFixedPosition = portalTarget === null || portalTarget === document.body;

    if (useFixedPosition) {
      setActiveHeading({
        top: rect.top + topOffset,
        left: rect.left - offset,
        headingKey: nextActive.key,
        tag: nextActive.tag,
        useFixedPosition,
      });
      return;
    }

    if (!portalTarget) {
      setActiveHeading(null);
      return;
    }

    const scrollContainerRect = portalTarget.getBoundingClientRect();
    setActiveHeading({
      top: rect.top - scrollContainerRect.top + portalTarget.scrollTop + topOffset,
      left: rect.left - scrollContainerRect.left + portalTarget.scrollLeft - offset,
      headingKey: nextActive.key,
      tag: nextActive.tag,
      useFixedPosition,
    });
  }, [editor, portalTarget]);

  const updateFromMouseEvent = useCallback(
    (event: MouseEvent) => {
      lastMouseEventRef.current = event;

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
        setHeadingPositions([]);
        setCodePosition(null);
        return;
      }

      const useFixedPosition = portalTarget === null || portalTarget === document.body;
      const scrollContainerRect = portalTarget?.getBoundingClientRect();
      let activeHeadingKey: string | null = null;

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === 'root' ? null : anchorNode.getTopLevelElementOrThrow();
          if (element && $isHeadingNode(element)) {
            activeHeadingKey = element.getKey();
          }
        }
      });
      activeHeadingKeyRef.current = activeHeadingKey;

      const nextHeadingPositions: HeadingPosition[] = [];
      headingKeysRef.current.forEach((key) => {
        if (hiddenKeysRef.current.has(key)) {
          return;
        }
        const element = editor.getElementByKey(key);
        if (!element || element.style.display === 'none') {
          return;
        }
        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);
        const lineHeight =
          Number.parseFloat(computedStyle.lineHeight || '0') || HEADING_ACTION_SIZE;
        const topOffset = Math.max(0, (lineHeight - HEADING_ACTION_SIZE) / 2);
        const offset =
          activeHeadingKeyRef.current === key
            ? HEADING_ACTION_OFFSET + HEADING_SLOT_GAP
            : HEADING_ACTION_OFFSET;

        if (useFixedPosition) {
          nextHeadingPositions.push({
            top: rect.top + topOffset,
            left: rect.left - offset,
            headingKey: key,
            useFixedPosition,
          });
          return;
        }

        if (!scrollContainerRect || !portalTarget) {
          return;
        }

        nextHeadingPositions.push({
          top: rect.top - scrollContainerRect.top + portalTarget.scrollTop + topOffset,
          left:
            rect.left -
            scrollContainerRect.left +
            portalTarget.scrollLeft -
            offset,
          headingKey: key,
          useFixedPosition,
        });
      });

      setHeadingPositions(nextHeadingPositions);

      const y = event.clientY;
      let closestCode: { key: string; rect: DOMRect; distance: number } | null = null;

      codeKeysRef.current.forEach((key) => {
        const element = editor.getElementByKey(key);
        if (
          !element ||
          element.style.display === 'none' ||
          element.getAttribute('data-collapsed') === 'true'
        ) {
          return;
        }
        const rect = element.getBoundingClientRect();
        let distance = 0;
        if (y < rect.top) {
          distance = rect.top - y;
        } else if (y > rect.bottom) {
          distance = y - rect.bottom;
        }

        if (!closestCode || distance < closestCode.distance) {
          closestCode = { key, rect, distance };
        }
      });

      if (!closestCode) {
        setCodePosition(null);
        return;
      }

      const codeElement = editor.getElementByKey(closestCode.key);
      if (!codeElement) {
        setCodePosition(null);
        return;
      }

      const codeStyle = window.getComputedStyle(codeElement);
      const codePaddingTop = Number.parseFloat(codeStyle.paddingTop || '0');
      const codeLineHeight =
        Number.parseFloat(codeStyle.lineHeight || '0') || CODE_ACTION_SIZE;
      const codeTopOffset =
        codePaddingTop + Math.max(0, (codeLineHeight - CODE_ACTION_SIZE) / 2);

      if (useFixedPosition) {
        setCodePosition({
          top: closestCode.rect.top + codeTopOffset,
          left: closestCode.rect.left - CODE_ACTION_OFFSET,
          nodeKey: closestCode.key,
          useFixedPosition,
        });
        return;
      }

      if (!scrollContainerRect || !portalTarget) {
        setCodePosition(null);
        return;
      }

      setCodePosition({
        top: closestCode.rect.top - scrollContainerRect.top + portalTarget.scrollTop + codeTopOffset,
        left:
          closestCode.rect.left -
          scrollContainerRect.left +
          portalTarget.scrollLeft -
          CODE_ACTION_OFFSET,
        nodeKey: closestCode.key,
        useFixedPosition,
      });
    },
    [editor, portalTarget, rootElement],
  );

  useEffect(() => {
    if (!portalTarget) {
      return;
    }

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    const observer = new ResizeObserver(() => {
      updateActiveHeadingIndicator();
      if (lastMouseEventRef.current) {
        updateFromMouseEvent(lastMouseEventRef.current);
      }
    });

    observer.observe(portalTarget);
    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [portalTarget, updateActiveHeadingIndicator, updateFromMouseEvent]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (selectionRafRef.current !== null) {
          cancelAnimationFrame(selectionRafRef.current);
        }
        selectionRafRef.current = requestAnimationFrame(() => {
          selectionRafRef.current = null;
          updateActiveHeadingIndicator();
          if (lastMouseEventRef.current) {
            updateFromMouseEvent(lastMouseEventRef.current);
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, updateActiveHeadingIndicator, updateFromMouseEvent]);

  useEffect(() => {
    updateActiveHeadingIndicator();
  }, [updateActiveHeadingIndicator]);

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

    const handleMouseDown = (event: MouseEvent) => {
      updateFromMouseEvent(event);
    };

    const handleScroll = () => {
      setHeadingPositions([]);
      setCodePosition(null);
    };
    const handleResize = () => {
      setHeadingPositions([]);
      setCodePosition(null);
      updateActiveHeadingIndicator();
      if (lastMouseEventRef.current) {
        updateFromMouseEvent(lastMouseEventRef.current);
      }
    };
    const target = portalTarget && portalTarget !== document.body ? portalTarget : window;

    target.addEventListener('mousemove', handleMouseMove);
    target.addEventListener('mousedown', handleMouseDown);
    target.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove);
      target.removeEventListener('mousedown', handleMouseDown);
      target.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [portalTarget, shouldListenMouseMove, updateFromMouseEvent]);

  useEffect(() => {
    if (!headingPositions.length) {
      setHeadingVisible(false);
      if (hideHeadingTimeoutRef.current) {
        clearTimeout(hideHeadingTimeoutRef.current);
      }
      if (headingRenderPositions.length) {
        hideHeadingTimeoutRef.current = setTimeout(() => {
          setHeadingRenderPositions([]);
        }, 180);
      }
      return;
    }

    setHeadingRenderPositions(headingPositions);
    setHeadingVisible(true);
  }, [headingPositions, headingRenderPositions]);

  useEffect(() => {
    if (!activeHeading) {
      setActiveHeadingVisible(false);
      if (hideActiveHeadingTimeoutRef.current) {
        clearTimeout(hideActiveHeadingTimeoutRef.current);
      }
      if (activeHeadingRender) {
        hideActiveHeadingTimeoutRef.current = setTimeout(() => {
          setActiveHeadingRender(null);
        }, 180);
      }
      return;
    }

    setActiveHeadingRender(activeHeading);
    setActiveHeadingVisible(true);
  }, [activeHeading, activeHeadingRender]);

  useEffect(() => {
    if (!codePosition) {
      setCodeVisible(false);
      if (hideCodeTimeoutRef.current) {
        clearTimeout(hideCodeTimeoutRef.current);
      }
      if (codeRenderPosition) {
        hideCodeTimeoutRef.current = setTimeout(() => {
          setCodeRenderPosition(null);
        }, 180);
      }
      return;
    }

    setCodeRenderPosition(codePosition);
    setCodeVisible(true);
  }, [codePosition, codeRenderPosition]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
      if (hideHeadingTimeoutRef.current) {
        clearTimeout(hideHeadingTimeoutRef.current);
      }
      if (hideActiveHeadingTimeoutRef.current) {
        clearTimeout(hideActiveHeadingTimeoutRef.current);
      }
      if (hideCodeTimeoutRef.current) {
        clearTimeout(hideCodeTimeoutRef.current);
      }
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  const toggleCollapsed = useCallback((headingKey: string) => {
    if (!headingKey) {
      return;
    }

    const collapsed = collapsedKeysRef.current;
    if (collapsed.has(headingKey)) {
      collapsed.delete(headingKey);
    } else {
      collapsed.add(headingKey);
    }
    applyCollapsedState();
    if (lastMouseEventRef.current) {
      requestAnimationFrame(() => updateFromMouseEvent(lastMouseEventRef.current));
    }
  }, [applyCollapsedState, updateFromMouseEvent]);

  const handleCopy = useCallback(() => {
    if (!codeRenderPosition) {
      return;
    }

    let codeText = '';
    editor.read(() => {
      const node = $getNodeByKey(codeRenderPosition.nodeKey);
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
  }, [editor, codeRenderPosition]);

  if (!headingRenderPositions.length && !activeHeadingRender && !codeRenderPosition) {
    return null;
  }

  return createPortal(
    <>
      {headingRenderPositions.map((position) => {
        const isCollapsed = collapsedKeysRef.current.has(position.headingKey);
        return (
          <div
            key={position.headingKey}
            className={`heading-gutter-actions z-50 transition-opacity duration-200 ease-out ${headingVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
              position: position.useFixedPosition ? 'fixed' : 'absolute',
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              className="flex size-5 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => toggleCollapsed(position.headingKey)}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </button>
          </div>
        );
      })}
      {activeHeadingRender && (
        <div
          className={`heading-indicator z-50 transition-opacity duration-200 ease-out ${activeHeadingVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            position: activeHeadingRender.useFixedPosition ? 'fixed' : 'absolute',
            top: activeHeadingRender.top,
            left: activeHeadingRender.left,
          }}
        >
          <div className="flex size-5 items-center justify-center text-zinc-400">
            {HEADING_ICONS[activeHeadingRender.tag]}
          </div>
        </div>
      )}
      {codeRenderPosition && (
        <div
          className={`code-gutter-actions z-50 transition-opacity duration-200 ease-out ${codeVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            position: codeRenderPosition.useFixedPosition ? 'fixed' : 'absolute',
            top: codeRenderPosition.top,
            left: codeRenderPosition.left,
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
        </div>
      )}
    </>,
    portalTarget ?? document.body
  );
}
