'use client';

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EllipsisIcon } from 'lucide-react';
import {
  $applyNodeReplacement,
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  createCommand,
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
} from 'lexical';

export const TOGGLE_HEADING_COLLAPSE_COMMAND = createCommand<string>();

export interface SerializedCollapseIndicatorNode extends SerializedLexicalNode {
  headingKey: string;
  type: 'collapse-indicator';
  version: 1;
}

export class CollapseIndicatorNode extends DecoratorNode<React.JSX.Element> {
  __headingKey: string;

  static getType(): string {
    return 'collapse-indicator';
  }

  static clone(node: CollapseIndicatorNode): CollapseIndicatorNode {
    return new CollapseIndicatorNode(node.__headingKey, node.__key);
  }

  constructor(headingKey: string, key?: NodeKey) {
    super(key);
    this.__headingKey = headingKey;
  }

  getHeadingKey(): string {
    return this.__headingKey;
  }

  isInline(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportJSON(): SerializedCollapseIndicatorNode {
    return {
      headingKey: this.__headingKey,
      type: 'collapse-indicator',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedCollapseIndicatorNode): CollapseIndicatorNode {
    return $createCollapseIndicatorNode(serializedNode.headingKey);
  }

  decorate(): React.JSX.Element {
    return <CollapseIndicator headingKey={this.__headingKey} />;
  }
}

export function $createCollapseIndicatorNode(headingKey: string): CollapseIndicatorNode {
  return $applyNodeReplacement(new CollapseIndicatorNode(headingKey));
}

export function $isCollapseIndicatorNode(
  node: LexicalNode | null | undefined,
): node is CollapseIndicatorNode {
  return node instanceof CollapseIndicatorNode;
}

function CollapseIndicator({ headingKey }: { headingKey: string }) {
  const [editor] = useLexicalComposerContext();

  const moveCursorBefore = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    editor.update(() => {
      const range = $createRangeSelection();
      range.anchor.set(headingKey, 0, 'element');
      range.focus.set(headingKey, 0, 'element');
      $setSelection(range);
    });
  };

  return (
    <span
      className="inline-flex items-center align-middle ml-2 leading-none"
      contentEditable={false}
      onMouseDown={moveCursorBefore}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full h-3.5 px-1.5 bg-zinc-100/80 dark:bg-zinc-800/70 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/70"
        onClick={() => editor.dispatchCommand(TOGGLE_HEADING_COLLAPSE_COMMAND, headingKey)}
        aria-label="Expand section"
      >
        <EllipsisIcon className="size-6" />
      </button>
    </span>
  );
}
