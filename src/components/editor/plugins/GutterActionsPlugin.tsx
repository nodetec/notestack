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
import { $findMatchingParent } from '@lexical/utils';
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
import {
  $createCollapseIndicatorNode,
  $isCollapseIndicatorNode,
  TOGGLE_HEADING_COLLAPSE_COMMAND,
} from '../nodes/CollapseIndicatorNode';

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
  const [isEditable, setIsEditable] = useState(editor.isEditable());
  const [codePositions, setCodePositions] = useState<CodePosition[]>([]);
  const [codeRenderPositions, setCodeRenderPositions] = useState<CodePosition[]>([]);
  const [codeVisible, setCodeVisible] = useState(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState(false);
  const lastMouseEventRef = useRef<MouseEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [collapsedKeysForRender, setCollapsedKeysForRender] = useState<Set<string>>(new Set());

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
    setIsEditable(editor.isEditable());
    return editor.registerEditableListener((nextEditable) => {
      setIsEditable(nextEditable);
      if (!nextEditable) {
        activeHeadingKeyRef.current = null;
      }
    });
  }, [editor]);

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

  const syncCollapseIndicatorNodes = useCallback(() => {
    let needsUpdate = false;

    editor.getEditorState().read(() => {
      headingKeysRef.current.forEach((key) => {
        const node = $getNodeByKey(key);
        if (!$isHeadingNode(node)) {
          return;
        }
        const indicators = node.getChildren().filter($isCollapseIndicatorNode);
        const shouldHave = collapsedKeysRef.current.has(key);
        if (shouldHave ? indicators.length !== 1 : indicators.length !== 0) {
          needsUpdate = true;
        }
      });
    });

    if (!needsUpdate) {
      return;
    }

    editor.update(() => {
      headingKeysRef.current.forEach((key) => {
        const node = $getNodeByKey(key);
        if (!$isHeadingNode(node)) {
          return;
        }
        const indicators = node.getChildren().filter($isCollapseIndicatorNode);
        const shouldHave = collapsedKeysRef.current.has(key);

        if (shouldHave) {
          indicators.forEach((indicator) => indicator.remove());
          node.append($createCollapseIndicatorNode(key));
        } else if (indicators.length) {
          indicators.forEach((indicator) => indicator.remove());
        }
      });
    });
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

    headingKeysRef.current.forEach((key) => {
      const element = editor.getElementByKey(key);
      if (!element) {
        return;
      }
      if (collapsedKeysRef.current.has(key)) {
        element.setAttribute('data-collapsed', 'true');
      } else {
        element.removeAttribute('data-collapsed');
      }
    });

    hiddenKeysRef.current = nextHiddenKeys;
    syncCollapseIndicatorNodes();
  }, [editor, syncCollapseIndicatorNodes]);

  useEffect(() => {
    return editor.registerMutationListener(
      HeadingNode,
      (mutations) => {
        let collapsedChanged = false;
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'created') {
              headingKeysRef.current.add(key);
            } else if (type === 'destroyed') {
              headingKeysRef.current.delete(key);
              if (collapsedKeysRef.current.delete(key)) {
                collapsedChanged = true;
              }
            }
          }
        });
        if (collapsedChanged) {
          setCollapsedKeysForRender(new Set(collapsedKeysRef.current));
        }
        setShouldListenMouseMove(
          headingKeysRef.current.size > 0 || codeKeysRef.current.size > 0,
        );
        applyCollapsedState();
      },
      { skipInitialization: false },
    );
  }, [editor, applyCollapsedState]);

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

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      applyCollapsedState();
    });
  }, [editor, applyCollapsedState]);

  const updateActiveHeadingIndicator = useCallback(() => {
    let nextActiveKey: string | null = null;
    let nextActiveTag: HeadingTagType | null = null;

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root'
          ? null
          : anchorNode.getTopLevelElementOrThrow();
        if (element && $isHeadingNode(element)) {
          nextActiveKey = element.getKey();
          nextActiveTag = element.getTag();
        }
      }
    });

    activeHeadingKeyRef.current = nextActiveKey;

    if (!nextActiveKey || !nextActiveTag) {
      setActiveHeading(null);
      return;
    }

    const element = editor.getElementByKey(nextActiveKey);
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
        headingKey: nextActiveKey,
        tag: nextActiveTag,
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
      headingKey: nextActiveKey,
      tag: nextActiveTag,
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
        setCodePositions([]);
        return;
      }

      const useFixedPosition = portalTarget === null || portalTarget === document.body;
      const scrollContainerRect = portalTarget?.getBoundingClientRect();
      let activeHeadingKey: string | null = null;

      if (isEditable) {
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
      }
      activeHeadingKeyRef.current = isEditable ? activeHeadingKey : null;

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

      const nextCodePositions: CodePosition[] = [];

      // Check if we're in markdown mode (single markdown code block)
      let isInMarkdownMode = false;
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        isInMarkdownMode = $isCodeNode(firstChild) &&
          firstChild.getLanguage() === 'markdown' &&
          root.getChildrenSize() === 1;
      });

      codeKeysRef.current.forEach((key) => {
        // Skip copy button for markdown mode code block
        if (isInMarkdownMode) {
          return;
        }

        const element = editor.getElementByKey(key);
        if (
          !element ||
          element.style.display === 'none' ||
          element.getAttribute('data-collapsed') === 'true'
        ) {
          return;
        }
        const rect = element.getBoundingClientRect();
        if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
          return;
        }

        const codeStyle = window.getComputedStyle(element);
        const codePaddingTop = Number.parseFloat(codeStyle.paddingTop || '0');
        const codeLineHeight =
          Number.parseFloat(codeStyle.lineHeight || '0') || CODE_ACTION_SIZE;
        const codeTopOffset =
          codePaddingTop + Math.max(0, (codeLineHeight - CODE_ACTION_SIZE) / 2);

        if (useFixedPosition) {
          nextCodePositions.push({
            top: rect.top + codeTopOffset,
            left: rect.left - CODE_ACTION_OFFSET,
            nodeKey: key,
            useFixedPosition,
          });
          return;
        }

        if (!scrollContainerRect || !portalTarget) {
          return;
        }

        nextCodePositions.push({
          top:
            rect.top -
            scrollContainerRect.top +
            portalTarget.scrollTop +
            codeTopOffset,
          left:
            rect.left -
            scrollContainerRect.left +
            portalTarget.scrollLeft -
            CODE_ACTION_OFFSET,
          nodeKey: key,
          useFixedPosition,
        });
      });

      setCodePositions(nextCodePositions);
    },
    [editor, isEditable, portalTarget, rootElement],
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
    syncCollapseIndicatorNodes();
  }, [updateActiveHeadingIndicator, syncCollapseIndicatorNodes]);

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    const handleMouseMove = (event: Event) => {
      if (!(event instanceof MouseEvent)) {
        return;
      }
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromMouseEvent(event);
      });
    };

    const handleMouseDown = (event: Event) => {
      if (event instanceof MouseEvent) {
        updateFromMouseEvent(event);
      }
    };

    const handleScroll = () => {
      if (!rootElement || !portalTarget) {
        return;
      }

      const rootRect = rootElement.getBoundingClientRect();
      const containerRect =
        portalTarget === document.body
          ? document.documentElement.getBoundingClientRect()
          : portalTarget.getBoundingClientRect();
      const rootStyle = window.getComputedStyle(rootElement);
      const paddingLeft =
        Number.parseFloat(rootStyle.paddingLeft || '0') || GUTTER_FALLBACK_WIDTH;
      const gutterLeft = containerRect.left;
      const gutterRight = rootRect.left + paddingLeft;
      const gutterX = Math.min(gutterRight - 1, gutterLeft + 4);

      const lastEvent = lastMouseEventRef.current;
      const clientX =
        lastEvent && lastEvent.clientX >= gutterLeft && lastEvent.clientX <= gutterRight
          ? lastEvent.clientX
          : gutterX;
      const clientY = lastEvent ? lastEvent.clientY : rootRect.top + rootRect.height / 2;

      const syntheticEvent = {
        clientX,
        clientY,
      } as MouseEvent;

      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateFromMouseEvent(syntheticEvent);
      });
    };
    const handleResize = () => {
      setHeadingPositions([]);
      setCodePositions([]);
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
  }, [portalTarget, rootElement, shouldListenMouseMove, updateFromMouseEvent, updateActiveHeadingIndicator]);

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
    if (!activeHeading || !isEditable) {
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
  }, [activeHeading, activeHeadingRender, isEditable]);

  useEffect(() => {
    if (!codePositions.length) {
      setCodeVisible(false);
      if (hideCodeTimeoutRef.current) {
        clearTimeout(hideCodeTimeoutRef.current);
      }
      if (codeRenderPositions.length) {
        hideCodeTimeoutRef.current = setTimeout(() => {
          setCodeRenderPositions([]);
        }, 180);
      }
      return;
    }

    setCodeRenderPositions(codePositions);
    setCodeVisible(true);
  }, [codePositions, codeRenderPositions]);

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
    setCollapsedKeysForRender(new Set(collapsed));
    applyCollapsedState();
    const lastEvent = lastMouseEventRef.current;
    if (lastEvent) {
      requestAnimationFrame(() => updateFromMouseEvent(lastEvent));
    }
  }, [applyCollapsedState, updateFromMouseEvent]);

  useEffect(() => {
    return editor.registerCommand(
      TOGGLE_HEADING_COLLAPSE_COMMAND,
      (headingKey) => {
        toggleCollapsed(headingKey);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, toggleCollapsed]);

  // Intercept backspace/delete at DOM level when cursor is AFTER the collapse indicator
  useEffect(() => {
    if (!rootElement) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        return;
      }

      let shouldHandle = false;
      let headingKey: string | null = null;

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        const heading = ($isHeadingNode(anchorNode)
          ? anchorNode
          : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null;

        if (!heading) {
          return;
        }

        const children = heading.getChildren();
        const indicatorIndex = children.findIndex($isCollapseIndicatorNode);

        if (indicatorIndex === -1) {
          return;
        }

        // Only handle when cursor is AFTER the indicator
        if (
          anchor.type === 'element' &&
          anchorNode === heading &&
          anchor.offset === indicatorIndex + 1
        ) {
          shouldHandle = true;
          headingKey = heading.getKey();
        }
      });

      if (shouldHandle && headingKey) {
        event.preventDefault();
        event.stopPropagation();

        const keyToUncollapse = headingKey;

        // Uncollapse the heading
        collapsedKeysRef.current.delete(keyToUncollapse);
        setCollapsedKeysForRender(new Set(collapsedKeysRef.current));

        editor.update(() => {
          const heading = $getNodeByKey(keyToUncollapse) as HeadingNode | null;
          if (!heading) return;

          // Remove the indicator
          const indicator = heading.getChildren().find($isCollapseIndicatorNode);
          if (indicator) {
            indicator.remove();
          }

          // Position cursor at end of heading
          heading.selectEnd();
        });

        // Update visibility of collapsed content
        applyCollapsedState();
      }
    };

    rootElement.addEventListener('keydown', handleKeyDown, true);
    return () => {
      rootElement.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor, rootElement, applyCollapsedState]);

  const handleCopy = useCallback((nodeKey: string) => {
    if (!nodeKey) {
      return;
    }

    let codeText = '';
    editor.read(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCodeNode(node)) {
        codeText = node.getTextContent();
      }
    });

    if (!codeText) {
      return;
    }

    void navigator.clipboard.writeText(codeText);
    setCopied(true);
    setCopiedKey(nodeKey);
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = setTimeout(() => {
      setCopied(false);
      setCopiedKey(null);
    }, 1200);
  }, [editor]);

  if (!headingRenderPositions.length && !activeHeadingRender && !codeRenderPositions.length) {
    return null;
  }

  return createPortal(
    <>
      {headingRenderPositions.map((position) => {
        const isCollapsed = collapsedKeysForRender.has(position.headingKey);
        return (
          <div
            key={position.headingKey}
            className={`heading-gutter-actions z-20 transition-opacity duration-200 ease-out ${headingVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{
              position: position.useFixedPosition ? 'fixed' : 'absolute',
              top: position.top,
              left: position.left,
            }}
          >
            <button
              type="button"
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
      {isEditable && activeHeadingRender && (
        <div
          className={`heading-indicator z-20 transition-opacity duration-200 ease-out ${activeHeadingVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            position: activeHeadingRender.useFixedPosition ? 'fixed' : 'absolute',
            top: activeHeadingRender.top,
            left: activeHeadingRender.left,
          }}
        >
          <div className="flex size-5 items-center justify-center text-muted-foreground">
            {HEADING_ICONS[activeHeadingRender.tag]}
          </div>
        </div>
      )}
      {codeRenderPositions.map((position) => (
        <div
          key={position.nodeKey}
          className={`code-gutter-actions z-20 transition-opacity duration-200 ease-out ${codeVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            position: position.useFixedPosition ? 'fixed' : 'absolute',
            top: position.top,
            left: position.left,
          }}
        >
          <button
            type="button"
            className="relative flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={() => handleCopy(position.nodeKey)}
            aria-label="Copy code block"
          >
            <CopyIcon
              className={`size-4 transition-all duration-200 ${copied && copiedKey === position.nodeKey ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}
            />
            <CheckIcon
              className={`absolute size-4 text-emerald-500 transition-all duration-200 ${copied && copiedKey === position.nodeKey ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
            />
          </button>
        </div>
      ))}
    </>,
    portalTarget ?? document.body
  );
}
