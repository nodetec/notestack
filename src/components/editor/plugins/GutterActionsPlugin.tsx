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
  $createPoint,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  BEFORE_INPUT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  DELETE_CHARACTER_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  REMOVE_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalNode,
  type TextNode,
} from 'lexical';
import { $isHeadingNode, HeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { $isCodeNode, CodeNode } from '@lexical/code';
import {
  $createCollapseIndicatorNode,
  $isCollapseIndicatorNode,
  CollapseIndicatorNode,
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

  const getLastTextNode = useCallback((node: LexicalNode): TextNode | null => {
    if ($isTextNode(node)) {
      return node;
    }
    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (let i = children.length - 1; i >= 0; i -= 1) {
        const candidate = getLastTextNode(children[i]);
        if (candidate) {
          return candidate;
        }
      }
    }
    return null;
  }, []);

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
      let closestCodeKey: string | null = null;
      let closestCodeRect: DOMRect | null = null;
      let closestCodeDistance: number = Number.POSITIVE_INFINITY;

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

        if (distance < closestCodeDistance) {
          closestCodeKey = key;
          closestCodeRect = rect;
          closestCodeDistance = distance;
        }
      });

      if (!closestCodeKey || !closestCodeRect) {
        setCodePosition(null);
        return;
      }

      const resolvedCodeRect = closestCodeRect as DOMRect;

      const codeElement = editor.getElementByKey(closestCodeKey);
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
          top: resolvedCodeRect.top + codeTopOffset,
          left: resolvedCodeRect.left - CODE_ACTION_OFFSET,
          nodeKey: closestCodeKey,
          useFixedPosition,
        });
        return;
      }

      if (!scrollContainerRect || !portalTarget) {
        setCodePosition(null);
        return;
      }

      setCodePosition({
        top:
          resolvedCodeRect.top -
          scrollContainerRect.top +
          portalTarget.scrollTop +
          codeTopOffset,
        left:
          resolvedCodeRect.left -
          scrollContainerRect.left +
          portalTarget.scrollLeft -
          CODE_ACTION_OFFSET,
        nodeKey: closestCodeKey,
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
  }, [portalTarget, shouldListenMouseMove, syncCollapseIndicatorNodes, updateFromMouseEvent, updateActiveHeadingIndicator]);

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

  useEffect(() => {
    return editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const heading = ($isHeadingNode(anchorNode)
          ? anchorNode
          : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null;
        if (!heading) {
          return false;
        }

        if (heading.getChildren().some($isCollapseIndicatorNode)) {
          editor.dispatchCommand(
            TOGGLE_HEADING_COLLAPSE_COMMAND,
            heading.getKey(),
          );
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      REMOVE_TEXT_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const heading = ($isHeadingNode(anchorNode)
          ? anchorNode
          : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null;
        if (!heading) {
          return false;
        }

        if (heading.getChildren().some($isCollapseIndicatorNode)) {
          editor.dispatchCommand(
            TOGGLE_HEADING_COLLAPSE_COMMAND,
            heading.getKey(),
          );
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    if (!rootElement) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        return;
      }

      let handled = false;
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const heading = ($isHeadingNode(anchorNode)
          ? anchorNode
          : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null;
        if (!heading) {
          return;
        }

        if (heading.getChildren().some($isCollapseIndicatorNode)) {
          editor.dispatchCommand(
            TOGGLE_HEADING_COLLAPSE_COMMAND,
            heading.getKey(),
          );
          handled = true;
        }
      });

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    rootElement.addEventListener('keydown', handleKeyDown, true);
    return () => {
      rootElement.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor, rootElement]);

  useEffect(() => {
    return editor.registerCommand(
      BEFORE_INPUT_COMMAND,
      (event) => {
        const inputType =
          typeof event === 'object' && event && 'inputType' in event
            ? String((event as InputEvent).inputType)
            : '';
        if (!inputType.startsWith('delete')) {
          return false;
        }

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchorNode = selection.anchor.getNode();
        const heading = ($isHeadingNode(anchorNode)
          ? anchorNode
          : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null;
        if (!heading) {
          return false;
        }

        if (heading.getChildren().some($isCollapseIndicatorNode)) {
          editor.dispatchCommand(
            TOGGLE_HEADING_COLLAPSE_COMMAND,
            heading.getKey(),
          );
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const nodes = selection.getNodes();
        const indicatorNode = nodes.find($isCollapseIndicatorNode) ?? null;
        const headingFromIndicator = indicatorNode
          ? ($getNodeByKey((indicatorNode as CollapseIndicatorNode).getHeadingKey()) as
              | HeadingNode
              | null)
          : null;
        const heading = headingFromIndicator ??
          (($isHeadingNode(anchorNode)
            ? anchorNode
            : $findMatchingParent(anchorNode, $isHeadingNode)) as HeadingNode | null);

        if (!heading) {
          return false;
        }

        const children = heading.getChildren();
        const indicatorIndex = children.findIndex($isCollapseIndicatorNode);
        if (indicatorIndex !== -1) {
          editor.dispatchCommand(
            TOGGLE_HEADING_COLLAPSE_COMMAND,
            heading.getKey(),
          );
          return true;
        }

        if (indicatorIndex <= 0) {
          return false;
        }

        const beforeIndicator = children[indicatorIndex - 1] ?? null;
        if (!beforeIndicator) {
          return false;
        }

        let shouldExpand = false;

        const isTextBefore = $isTextNode(beforeIndicator);
        const endOffset = isTextBefore
          ? beforeIndicator.getTextContent().length
          : $isElementNode(beforeIndicator)
            ? beforeIndicator.getChildrenSize()
            : 0;
        const endPoint = $createPoint(
          beforeIndicator.getKey(),
          endOffset,
          isTextBefore ? 'text' : 'element',
        );

        if (selection.anchor.is(endPoint)) {
          shouldExpand = true;
        }

        if ($isElementNode(anchorNode) && anchor.type === 'element' && anchorNode === heading) {
          shouldExpand = shouldExpand || anchor.offset >= indicatorIndex;
        } else if ($isTextNode(anchorNode) && heading.isParentOf(anchorNode)) {
          const lastText = getLastTextNode(beforeIndicator);
          const isAtEnd = anchor.offset === anchorNode.getTextContent().length;
          shouldExpand = shouldExpand || Boolean(lastText && anchorNode === lastText && isAtEnd);
        }

        if (!shouldExpand) {
          return false;
        }

        editor.dispatchCommand(
          TOGGLE_HEADING_COLLAPSE_COMMAND,
          heading.getKey(),
        );
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, getLastTextNode]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const nodes = selection.getNodes();
        const indicatorNode = nodes.find($isCollapseIndicatorNode) ?? null;
        if (!indicatorNode) {
          return false;
        }

        const headingKey = (indicatorNode as CollapseIndicatorNode).getHeadingKey();
        editor.dispatchCommand(TOGGLE_HEADING_COLLAPSE_COMMAND, headingKey);
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

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
            className={`heading-gutter-actions z-20 transition-opacity duration-200 ease-out ${headingVisible ? 'opacity-100' : 'opacity-0'}`}
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
          className={`heading-indicator z-20 transition-opacity duration-200 ease-out ${activeHeadingVisible ? 'opacity-100' : 'opacity-0'}`}
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
          className={`code-gutter-actions z-20 transition-opacity duration-200 ease-out ${codeVisible ? 'opacity-100' : 'opacity-0'}`}
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
