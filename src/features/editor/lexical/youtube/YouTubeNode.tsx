import type { JSX } from "react";
import * as React from "react";
import { useCallback, useEffect, useRef } from "react";

import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from "lexical";

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoID: string;
}>;

function YouTubeComponent({
  className,
  format,
  nodeKey,
  videoID,
}: YouTubeComponentProps) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const isEditable = useLexicalEditable();

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();
      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        deleteSelection.getNodes().forEach((node) => {
          if ($isYouTubeNode(node)) {
            node.remove();
          }
        });
        return true;
      }
      return false;
    },
    [isSelected],
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

        // Get the YouTube node
        const youtubeNode = $getNodeByKey(nodeKey);
        if (youtubeNode) {
          // Create a new paragraph
          const paragraphNode = $createParagraphNode();
          // Insert after the YouTube node
          youtubeNode.insertAfter(paragraphNode);
          // Set selection to the new paragraph
          paragraphNode.selectEnd();
        }

        // Clear the YouTube selection
        clearSelection();
        return true;
      }
      return false;
    },
    [isSelected, nodeKey, clearSelection],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        $onEnter,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $onEnter, $onDelete]);

  const isFocused = isSelected && isEditable;

  return (
    <div className="relative">
      <BlockWithAlignableContents
        className={{
          ...className,
          base: className.base + (isFocused ? " outline outline-blue-500" : ""),
        }}
        format={format}
        nodeKey={nodeKey}
      >
        <iframe
          className="h-auto w-auto max-w-full sm:h-[315px] sm:w-[500px]"
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
          title="YouTube video"
        />
      </BlockWithAlignableContents>

      {/* Close button in upper right corner */}
      {isFocused && (
        <button
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black bg-opacity-50 text-white transition-opacity hover:bg-opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          aria-label="Remove YouTube embed"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}

export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
  },
  SerializedDecoratorBlockNode
>;

function $convertYoutubeElement(
  domNode: HTMLElement,
): null | DOMConversionOutput {
  const videoID = domNode.getAttribute("data-lexical-youtube");
  if (videoID) {
    const node = $createYouTubeNode(videoID);
    return { node };
  }
  return null;
}

export class YouTubeNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoID).updateFromJSON(
      serializedNode,
    );
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      videoID: this.__id,
    };
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("iframe");
    element.setAttribute("data-lexical-youtube", this.__id);
    element.setAttribute("width", "560");
    element.setAttribute("height", "315");
    element.setAttribute(
      "src",
      `https://www.youtube-nocookie.com/embed/${this.__id}`,
    );
    element.setAttribute("frameborder", "0");
    element.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    );
    element.setAttribute("allowfullscreen", "true");
    element.setAttribute("title", "YouTube video");
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-youtube")) {
          return null;
        }
        return {
          conversion: $convertYoutubeElement,
          priority: 1,
        };
      },
    };
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(): // _includeInert?: boolean | undefined,
  // _includeDirectionless?: false | undefined,
  string {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    };
    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoID={this.__id}
      />
    );
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined,
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
