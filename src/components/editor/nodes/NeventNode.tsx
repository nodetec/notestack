'use client';

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditorContext, type NostrNote } from '../context/EditorContext';

export interface NeventPayload {
  nevent: string;
  isEmbed?: boolean;
  key?: NodeKey;
}

export type SerializedNeventNode = Spread<
  {
    nevent: string;
    isEmbed: boolean;
  },
  SerializedLexicalNode
>;

function getDisplayText(nevent: string): string {
  if (nevent.length < 10) return nevent;
  return `nevent...${nevent.slice(-4)}`;
}

function NeventComponent({
  nevent,
  isEmbed,
  nodeKey,
}: {
  nevent: string;
  isEmbed: boolean;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const { onNoteLookup } = useEditorContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nevent);
  const [editIsEmbed, setEditIsEmbed] = useState(isEmbed);
  const [note, setNote] = useState<NostrNote | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayText = getDisplayText(nevent);
  const isLoading = isEmbed && !!onNoteLookup && !hasFetched;

  // Only fetch note content when isEmbed is true
  useEffect(() => {
    if (!isEmbed || !onNoteLookup) {
      setNote(null);
      setHasFetched(true);
      return;
    }

    setHasFetched(false);
    onNoteLookup(nevent)
      .then((result) => {
        setNote(result);
      })
      .catch((err) => {
        console.error('[NeventComponent] Note lookup failed:', err);
      })
      .finally(() => {
        setHasFetched(true);
      });
  }, [nevent, isEmbed, onNoteLookup]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(nevent);
    setEditIsEmbed(isEmbed);
    setIsEditing(true);
  }, [nevent, isEmbed]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && /^nevent1[a-z0-9]+$/i.test(trimmed)) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isNeventNode(node)) {
          const newNode = $createNeventNode({ nevent: trimmed, isEmbed: editIsEmbed });
          node.replace(newNode);
        }
      });
    }
    setIsEditing(false);
  }, [editor, nodeKey, editValue, editIsEmbed]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(nevent);
    setEditIsEmbed(isEmbed);
  }, [nevent, isEmbed]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleCancel]);

  // Truncate content for display
  const truncatedContent = note?.content
    ? note.content.length > 100
      ? note.content.slice(0, 100) + '...'
      : note.content
    : null;

  // Edit popup component (shared between both render modes)
  const editPopup = isEditing && (
    <div
      ref={popupRef}
      className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3 min-w-80"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2">
        <div>
          <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Nevent
          </label>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="nevent1..."
            className="w-full px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-mono"
            autoFocus
            autoComplete="off"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editIsEmbed}
            onChange={(e) => setEditIsEmbed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Show as embed (nostr: prefix)
          </span>
        </label>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  // Render note preview card when isEmbed is true and we have content
  if (isEmbed && note && truncatedContent) {
    return (
      <span ref={containerRef} className="relative inline-block align-middle">
        <span
          className="inline-flex items-start gap-2 p-2 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-lg max-w-md mx-1"
          title={nevent}
        >
          {note.authorPicture && (
            <img
              src={note.authorPicture}
              alt={note.authorName || 'Author'}
              className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5"
            />
          )}
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1">
              {note.authorName && (
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {note.authorName}
                </span>
              )}
              <button
                onClick={handleEditClick}
                className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded flex-shrink-0"
                title="Edit nevent"
                aria-label="Edit nevent"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </span>
            <span className="block text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
              &ldquo;{truncatedContent}&rdquo;
            </span>
          </span>
        </span>
        {editPopup}
      </span>
    );
  }

  // Fallback: display nevent text (plain mode, loading, or no note found)
  return (
    <span ref={containerRef} className="relative inline-flex items-center gap-1">
      <span
        className="text-blue-500 cursor-default"
        title={nevent}
      >
        {isLoading ? 'Loading...' : displayText}
      </span>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit nevent"
        aria-label="Edit nevent"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>
      {editPopup}
    </span>
  );
}

export class NeventNode extends DecoratorNode<ReactNode> {
  __nevent: string;
  __isEmbed: boolean;

  static getType(): string {
    return 'nevent';
  }

  static clone(node: NeventNode): NeventNode {
    return new NeventNode(node.__nevent, node.__isEmbed, node.__key);
  }

  static importJSON(serializedNode: SerializedNeventNode): NeventNode {
    const { nevent, isEmbed = false } = serializedNode;
    return $createNeventNode({ nevent, isEmbed });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const nevent = domNode.getAttribute('data-nevent');
        if (!nevent) return null;
        const isEmbed = domNode.getAttribute('data-is-embed') === 'true';
        return {
          conversion: () => ({
            node: $createNeventNode({ nevent, isEmbed }),
          }),
          priority: 1,
        };
      },
    };
  }

  constructor(nevent: string, isEmbed: boolean = false, key?: NodeKey) {
    super(key);
    this.__nevent = nevent;
    this.__isEmbed = isEmbed;
  }

  exportJSON(): SerializedNeventNode {
    return {
      type: 'nevent',
      version: 1,
      nevent: this.__nevent,
      isEmbed: this.__isEmbed,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-nevent', this.__nevent);
    span.setAttribute('data-is-embed', String(this.__isEmbed));
    span.textContent = getDisplayText(this.__nevent);
    return { element: span };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.nevent;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getNevent(): string {
    return this.__nevent;
  }

  getIsEmbed(): boolean {
    return this.__isEmbed;
  }

  getTextContent(): string {
    return this.__isEmbed ? `nostr:${this.__nevent}` : this.__nevent;
  }

  decorate(): ReactNode {
    return (
      <NeventComponent
        nevent={this.__nevent}
        isEmbed={this.__isEmbed}
        nodeKey={this.__key}
      />
    );
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

export function $createNeventNode({ nevent, isEmbed = false, key }: NeventPayload): NeventNode {
  return $applyNodeReplacement(new NeventNode(nevent, isEmbed, key));
}

export function $isNeventNode(node: LexicalNode | null | undefined): node is NeventNode {
  return node instanceof NeventNode;
}
