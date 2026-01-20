'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { mergeRegister } from '@lexical/utils';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { XIcon, MoreVerticalIcon, LinkIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { $createLinkNode } from '../nodes/LinkNode';

type YouTubeComponentProps = Readonly<{
  nodeKey: NodeKey;
  videoID: string;
}>;

async function fetchYouTubeTitle(videoID: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoID}`;
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

function YouTubeComponent({ nodeKey, videoID }: YouTubeComponentProps) {
  const [editor] = useLexicalComposerContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const isEditable = useLexicalEditable();

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const { mutate: convertToLink, isPending: isConverting } = useMutation({
    mutationFn: () => fetchYouTubeTitle(videoID),
    onSuccess: (title) => {
      const url = `https://www.youtube.com/watch?v=${videoID}`;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          const linkNode = $createLinkNode({ url, displayText: title || 'YouTube' });
          node.replace(linkNode);
        }
      });
    },
  });

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();
      if (isSelected && $isNodeSelection(deleteSelection)) {
        payload.preventDefault();
        deleteSelection.getNodes().forEach((node) => {
          if ($isYouTubeNode(node)) {
            node.remove();
          }
        });
        return true;
      }
      return false;
    },
    [isSelected]
  );

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        event.preventDefault();
        const youtubeNode = $getNodeByKey(nodeKey);
        if (youtubeNode) {
          const paragraphNode = $createParagraphNode();
          youtubeNode.insertAfter(paragraphNode);
          paragraphNode.selectEnd();
        }
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, nodeKey, clearSelection]
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isSelected, setSelected, clearSelection]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [editor, onClick, $onEnter, $onDelete]);

  const isFocused = isSelected && isEditable;

  return (
    <span className="inline-block align-bottom my-2 w-full">
      <span
        ref={containerRef}
        className={`relative block rounded-lg border-2 transition-colors p-10 mx-1 ${
          isFocused
            ? 'border-blue-500'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
        }`}
      >
        <span className="relative block w-full overflow-hidden rounded" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoID}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video"
          />
        </span>

        {/* X button to delete - top right, always visible in edit mode */}
        {isEditable && (
          <button
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-500 dark:bg-zinc-600 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-colors z-50 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode();
            }}
            aria-label="Remove YouTube embed"
            type="button"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}

        {/* More options menu - bottom right, always visible in edit mode */}
        {isEditable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-500 dark:bg-zinc-600 text-white dark:text-zinc-200 hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-colors z-50 shadow-md"
                onClick={(e) => e.stopPropagation()}
                aria-label="More options"
                type="button"
              >
                <MoreVerticalIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => convertToLink()} disabled={isConverting}>
                <LinkIcon className="mr-2 h-4 w-4" />
                {isConverting ? 'Converting...' : 'Convert to link'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>
    </span>
  );
}

export type SerializedYouTubeNode = Spread<
  { videoID: string },
  SerializedLexicalNode
>;

function $convertYoutubeElement(domNode: HTMLElement): null | DOMConversionOutput {
  const videoID = domNode.getAttribute('data-lexical-youtube');
  if (videoID) {
    const node = $createYouTubeNode(videoID);
    return { node };
  }
  return null;
}

export class YouTubeNode extends DecoratorNode<React.ReactNode> {
  __id: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoID);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      type: 'youtube',
      version: 1,
      videoID: this.__id,
    };
  }

  constructor(id: string, key?: NodeKey) {
    super(key);
    this.__id = id;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('iframe');
    element.setAttribute('data-lexical-youtube', this.__id);
    element.setAttribute('width', '560');
    element.setAttribute('height', '315');
    element.setAttribute('src', `https://www.youtube-nocookie.com/embed/${this.__id}`);
    element.setAttribute('frameborder', '0');
    element.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    );
    element.setAttribute('allowfullscreen', 'true');
    element.setAttribute('title', 'YouTube video');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-youtube')) {
          return null;
        }
        return {
          conversion: $convertYoutubeElement,
          priority: 1,
        };
      },
    };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.youtube;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(): string {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): React.ReactNode {
    return (
      <YouTubeComponent
        nodeKey={this.getKey()}
        videoID={this.__id}
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

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return $applyNodeReplacement(new YouTubeNode(videoID));
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
