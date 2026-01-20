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
import { useEditorContext, type NostrProfile } from '../context/EditorContext';

export interface NprofilePayload {
  nprofile: string;
  isEmbed?: boolean;
  key?: NodeKey;
}

export type SerializedNprofileNode = Spread<
  {
    nprofile: string;
    isEmbed: boolean;
  },
  SerializedLexicalNode
>;

function getDisplayText(nprofile: string): string {
  if (nprofile.length < 12) return nprofile;
  return `nprofile...${nprofile.slice(-4)}`;
}

function NprofileComponent({
  nprofile,
  isEmbed,
  nodeKey,
}: {
  nprofile: string;
  isEmbed: boolean;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const { onProfileLookup } = useEditorContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nprofile);
  const [editIsEmbed, setEditIsEmbed] = useState(isEmbed);
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Only fetch profile data when isEmbed is true
  useEffect(() => {
    if (!isEmbed || !onProfileLookup) {
      setProfile(null);
      return;
    }
    onProfileLookup(nprofile).then(setProfile);
  }, [nprofile, isEmbed, onProfileLookup]);

  const displayText = (isEmbed && profile?.name) || getDisplayText(nprofile);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(nprofile);
    setEditIsEmbed(isEmbed);
    setIsEditing(true);
  }, [nprofile, isEmbed]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && /^nprofile1[a-z0-9]+$/i.test(trimmed)) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isNprofileNode(node)) {
          const newNode = $createNprofileNode({ nprofile: trimmed, isEmbed: editIsEmbed });
          node.replace(newNode);
        }
      });
    }
    setIsEditing(false);
  }, [editor, nodeKey, editValue, editIsEmbed]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(nprofile);
    setEditIsEmbed(isEmbed);
  }, [nprofile, isEmbed]);

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

  return (
    <span ref={containerRef} className="relative inline-flex items-center gap-1">
      {isEmbed && profile?.picture && (
        <img
          src={profile.picture}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      <span
        className="text-blue-500 cursor-default"
        title={nprofile}
      >
        {displayText}
      </span>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit nprofile"
        aria-label="Edit nprofile"
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

      {isEditing && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3 min-w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Nprofile
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="nprofile1..."
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
      )}
    </span>
  );
}

export class NprofileNode extends DecoratorNode<ReactNode> {
  __nprofile: string;
  __isEmbed: boolean;

  static getType(): string {
    return 'nprofile';
  }

  static clone(node: NprofileNode): NprofileNode {
    return new NprofileNode(node.__nprofile, node.__isEmbed, node.__key);
  }

  static importJSON(serializedNode: SerializedNprofileNode): NprofileNode {
    const { nprofile, isEmbed = false } = serializedNode;
    return $createNprofileNode({ nprofile, isEmbed });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        const nprofile = domNode.getAttribute('data-nprofile');
        if (!nprofile) return null;
        const isEmbed = domNode.getAttribute('data-is-embed') === 'true';
        return {
          conversion: () => ({
            node: $createNprofileNode({ nprofile, isEmbed }),
          }),
          priority: 1,
        };
      },
    };
  }

  constructor(nprofile: string, isEmbed: boolean = false, key?: NodeKey) {
    super(key);
    this.__nprofile = nprofile;
    this.__isEmbed = isEmbed;
  }

  exportJSON(): SerializedNprofileNode {
    return {
      type: 'nprofile',
      version: 1,
      nprofile: this.__nprofile,
      isEmbed: this.__isEmbed,
    };
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement('span');
    span.setAttribute('data-nprofile', this.__nprofile);
    span.setAttribute('data-is-embed', String(this.__isEmbed));
    span.textContent = getDisplayText(this.__nprofile);
    return { element: span };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.nprofile;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getNprofile(): string {
    return this.__nprofile;
  }

  getIsEmbed(): boolean {
    return this.__isEmbed;
  }

  getTextContent(): string {
    return this.__isEmbed ? `nostr:${this.__nprofile}` : this.__nprofile;
  }

  decorate(): ReactNode {
    return (
      <NprofileComponent
        nprofile={this.__nprofile}
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

export function $createNprofileNode({ nprofile, isEmbed = false, key }: NprofilePayload): NprofileNode {
  return $applyNodeReplacement(new NprofileNode(nprofile, isEmbed, key));
}

export function $isNprofileNode(node: LexicalNode | null | undefined): node is NprofileNode {
  return node instanceof NprofileNode;
}
