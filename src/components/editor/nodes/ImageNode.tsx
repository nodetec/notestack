'use client';

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { mergeRegister } from '@lexical/utils';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface ImagePayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isLoadError, setIsLoadError] = useState(false);
  const isEditable = useLexicalEditable();

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      const deleteSelection = $getSelection();
      if (isSelected && $isNodeSelection(deleteSelection)) {
        event.preventDefault();
        deleteSelection.getNodes().forEach((node) => {
          if ($isImageNode(node)) {
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
        const imageNode = $getNodeByKey(nodeKey);
        if (imageNode) {
          const paragraphNode = $createParagraphNode();
          imageNode.insertAfter(paragraphNode);
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
      if (event.target === imageRef.current) {
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
    const unregister = mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        $onEnter,
        COMMAND_PRIORITY_CRITICAL
      )
    );

    return () => {
      unregister();
    };
  }, [editor, onClick, $onDelete, $onEnter]);

  const isFocused = isSelected && isEditable;

  if (isLoadError) {
    return (
      <span className="inline p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 text-sm">
        Failed to load image
      </span>
    );
  }

  return (
    <img
      ref={imageRef}
      src={src}
      alt={altText}
      style={{
        maxWidth: '100%',
        height: 'auto',
        width: width ? `${width}px` : undefined,
      }}
      className={`rounded-lg cursor-default ${
        isFocused ? 'outline outline-2 outline-blue-500 outline-offset-2' : ''
      }`}
      draggable="false"
      onError={() => setIsLoadError(true)}
    />
  );
}

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ src, altText, width, height });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode: HTMLElement) => {
          const img = domNode as HTMLImageElement;
          const src = img.getAttribute('src');
          if (!src) return null;
          const altText = img.getAttribute('alt') || '';
          return {
            node: $createImageNode({ src, altText }),
          };
        },
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText?: string,
    width?: number,
    height?: number,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || '';
    this.__width = width;
    this.__height = height;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    img.setAttribute('alt', this.__altText);
    if (this.__width) {
      img.setAttribute('width', String(this.__width));
    }
    if (this.__height) {
      img.setAttribute('height', String(this.__height));
    }
    return { element: img };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): ReactNode {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
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

export function $createImageNode({
  src,
  altText = '',
  width,
  height,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height, key));
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
