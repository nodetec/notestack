'use client';

import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {
  $applyNodeReplacement,
  $createTextNode,
  $getNodeByKey,
  DecoratorNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $createYouTubeNode } from './YouTubeNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { $isLinkNode } from '@lexical/link';

export interface SerializedLinkPencilNode extends SerializedLexicalNode {
  linkKey: string;
  type: 'link-pencil';
  version: 1;
}

function getLinkAttributes(url: string) {
  if (url.startsWith('#')) {
    return { target: null, rel: null };
  }
  return { target: '_blank', rel: 'noopener noreferrer' };
}

function isYouTubeUrl(url: string): boolean {
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com')
  );
}

function extractYouTubeVideoId(url: string): string | null {
  const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
  return match?.[2] && match[2].length === 11 ? match[2] : null;
}

function LinkPencilComponent({ linkKey }: { linkKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editText, setEditText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  const loadLinkData = useCallback(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(linkKey);
      if (!$isLinkNode(node)) {
        return;
      }
      const nextUrl = node.getURL();
      const nextText = node.getTextContent();
      setEditUrl((current) => (current === nextUrl ? current : nextUrl));
      setEditText((current) => (current === nextText ? current : nextText));
    });
  }, [editor, linkKey]);

  const openEditor = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      loadLinkData();
      setIsEditing(true);
    },
    [loadLinkData]
  );

  const closeEditor = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    const nextUrl = editUrl.trim();
    if (!nextUrl) {
      closeEditor();
      return;
    }

    editor.update(() => {
      const node = $getNodeByKey(linkKey);
      if (!$isLinkNode(node)) {
        return;
      }
      const nextText = editText.trim() || nextUrl;
      const attributes = getLinkAttributes(nextUrl);
      const replacement = $createLinkNode(nextUrl, attributes);
      replacement.append($createTextNode(nextText));
      node.replace(replacement);
    });

    closeEditor();
  }, [closeEditor, editText, editUrl, editor, linkKey]);

  const handleConvertToEmbed = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(linkKey);
      if (!$isLinkNode(node)) {
        return;
      }
      const url = node.getURL();
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return;
      }
      node.replace($createYouTubeNode(videoId));
    });
    closeEditor();
  }, [closeEditor, editor, linkKey]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        closeEditor();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeEditor, isEditing]);

  useEffect(() => {
    if (isEditing) {
      return;
    }
    return editor.registerUpdateListener(() => {
      loadLinkData();
    });
  }, [editor, isEditing, loadLinkData]);

  useEffect(() => {
    loadLinkData();
  }, [loadLinkData]);

  if (!isEditable) {
    return null;
  }

  const isAnchorLink = editUrl.startsWith('#');
  const showEmbedOption = !isAnchorLink && isYouTubeUrl(editUrl);

  return (
    <span
      className="relative inline-flex items-center align-middle ml-1"
      contentEditable={false}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {!isAnchorLink && (
        <button
          type="button"
          aria-label="Edit link"
          title="Edit link"
          onClick={openEditor}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
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
      )}

      {isEditing && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-card p-3 shadow-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Text</label>
              <input
                type="text"
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                autoFocus
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">URL</label>
              <input
                type="text"
                value={editUrl}
                onChange={(event) => setEditUrl(event.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                autoComplete="url"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {showEmbedOption && (
                <button
                  type="button"
                  onClick={handleConvertToEmbed}
                  className="mr-auto rounded px-2 py-1 text-xs text-foreground hover:bg-muted"
                >
                  Convert to embed
                </button>
              )}
              <button
                type="button"
                onClick={closeEditor}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
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

export class LinkPencilNode extends DecoratorNode<React.JSX.Element> {
  __linkKey: string;

  static getType(): string {
    return 'link-pencil';
  }

  static clone(node: LinkPencilNode): LinkPencilNode {
    return new LinkPencilNode(node.__linkKey, node.__key);
  }

  constructor(linkKey: string, key?: NodeKey) {
    super(key);
    this.__linkKey = linkKey;
  }

  getLinkKey(): string {
    return this.__linkKey;
  }

  setLinkKey(linkKey: string): this {
    const writable = this.getWritable();
    writable.__linkKey = linkKey;
    return writable;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    return document.createElement('span');
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedLinkPencilNode {
    return {
      linkKey: this.__linkKey,
      type: 'link-pencil',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedLinkPencilNode): LinkPencilNode {
    return $createLinkPencilNode(serializedNode.linkKey);
  }

  decorate(): React.JSX.Element {
    return <LinkPencilComponent linkKey={this.__linkKey} />;
  }
}

export function $createLinkPencilNode(linkKey: string): LinkPencilNode {
  return $applyNodeReplacement(new LinkPencilNode(linkKey));
}

export function $isLinkPencilNode(
  node: LexicalNode | null | undefined,
): node is LinkPencilNode {
  return node instanceof LinkPencilNode;
}
