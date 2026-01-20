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
import { $createYouTubeNode } from './YouTubeNode';

export interface LinkPayload {
  url: string;
  displayText?: string;
  key?: NodeKey;
}

export type SerializedLinkNode = Spread<
  {
    url: string;
    displayText?: string;
  },
  SerializedLexicalNode
>;

function getDisplayTextFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Get last non-empty segment
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
    // Fallback to hostname
    return urlObj.hostname;
  } catch {
    return url;
  }
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

function LinkComponent({
  url,
  displayText,
  nodeKey,
}: {
  url: string;
  displayText?: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(url);
  const [editDisplayText, setEditDisplayText] = useState(displayText || '');
  const containerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const resolvedDisplayText = displayText || getDisplayTextFromUrl(url);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditUrl(url);
    setEditDisplayText(displayText || '');
    setIsEditing(true);
  }, [url, displayText]);

  const handleSave = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isLinkNode(node)) {
        const newDisplayText = editDisplayText.trim() || undefined;
        const newNode = $createLinkNode({ url: editUrl, displayText: newDisplayText });
        node.replace(newNode);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, editUrl, editDisplayText]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditUrl(url);
    setEditDisplayText(displayText || '');
  }, [url, displayText]);

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

  const handleConvertToEmbed = useCallback(() => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return;

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isLinkNode(node)) {
        const youtubeNode = $createYouTubeNode(videoId);
        node.replace(youtubeNode);
      }
    });
    setIsEditing(false);
  }, [editor, nodeKey, url]);

  const isYouTube = isYouTubeUrl(url);

  // Close popup when clicking outside
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
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {resolvedDisplayText}
      </a>
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded"
        title="Edit link"
        aria-label="Edit link"
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
          className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3 min-w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Display Text
              </label>
              <input
                type="text"
                value={editDisplayText}
                onChange={(e) => setEditDisplayText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getDisplayTextFromUrl(editUrl)}
                className="w-full px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                autoFocus
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                URL
              </label>
              <input
                type="text"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                autoComplete="url"
              />
            </div>
            {isYouTube && (
              <button
                onClick={handleConvertToEmbed}
                className="w-full px-2 py-1.5 text-xs text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                Convert to embed
              </button>
            )}
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

export class LinkNode extends DecoratorNode<ReactNode> {
  __url: string;
  __displayText?: string;

  static getType(): string {
    return 'custom-link';
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode(node.__url, node.__displayText, node.__key);
  }

  static importJSON(serializedNode: SerializedLinkNode): LinkNode {
    const { url, displayText } = serializedNode;
    return $createLinkNode({ url, displayText });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: () => ({
        conversion: (domNode: HTMLElement) => {
          const anchor = domNode as HTMLAnchorElement;
          const url = anchor.getAttribute('href');
          if (!url) return null;
          const displayText = anchor.textContent || undefined;
          return {
            node: $createLinkNode({ url, displayText }),
          };
        },
        priority: 1,
      }),
    };
  }

  constructor(url: string, displayText?: string, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__displayText = displayText;
  }

  exportJSON(): SerializedLinkNode {
    return {
      type: 'custom-link',
      version: 1,
      url: this.__url,
      displayText: this.__displayText,
    };
  }

  exportDOM(): DOMExportOutput {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', this.__url);
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
    anchor.textContent = this.__displayText || getDisplayTextFromUrl(this.__url);
    return { element: anchor };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.link;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getUrl(): string {
    return this.__url;
  }

  getDisplayText(): string | undefined {
    return this.__displayText;
  }

  getTextContent(): string {
    return this.__displayText || getDisplayTextFromUrl(this.__url);
  }

  decorate(): ReactNode {
    return (
      <LinkComponent
        url={this.__url}
        displayText={this.__displayText}
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

export function $createLinkNode({ url, displayText, key }: LinkPayload): LinkNode {
  return $applyNodeReplacement(new LinkNode(url, displayText, key));
}

export function $isLinkNode(node: LexicalNode | null | undefined): node is LinkNode {
  return node instanceof LinkNode;
}
