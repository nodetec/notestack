import type { JSX } from "react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { useTheme } from "next-themes";

const WIDGET_SCRIPT_URL = "https://platform.twitter.com/widgets.js";

declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (
          tweetID: string,
          element: HTMLElement,
          options?: { theme?: "dark" | "light" },
        ) => Promise<void>;
      };
    };
  }
}

type TweetComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  loadingComponent?: JSX.Element | string;
  nodeKey: NodeKey;
  onError?: (error: string) => void;
  onLoad?: () => void;
  tweetID: string;
}>;

function $convertTweetElement(
  domNode: HTMLDivElement,
): DOMConversionOutput | null {
  const id = domNode.getAttribute("data-lexical-tweet-id");
  if (id) {
    const node = $createTweetNode(id);
    return { node };
  }
  return null;
}

let isTwitterScriptLoading = true;

function TweetComponent({
  className,
  format,
  loadingComponent,
  nodeKey,
  onError,
  onLoad,
  tweetID,
}: TweetComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previousTweetIDRef = useRef<string>("");
  const [isTweetLoading, setIsTweetLoading] = useState(false);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const isEditable = useLexicalEditable();
  const { theme, resolvedTheme } = useTheme();

  // Determine if we're in dark mode
  const isDarkTheme = theme === "dark" || resolvedTheme === "dark";

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
          if ($isTweetNode(node)) {
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

        // Get the Tweet node
        const tweetNode = $getNodeByKey(nodeKey);
        if (tweetNode) {
          // Create a new paragraph
          const paragraphNode = $createParagraphNode();
          // Insert after the Tweet node
          tweetNode.insertAfter(paragraphNode);
          // Set selection to the new paragraph
          paragraphNode.selectEnd();
        }

        // Clear the Tweet selection
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

  const createTweet = useCallback(async () => {
    try {
      // @ts-expect-error Twitter is attached to the window.
      await window.twttr.widgets.createTweet(tweetID, containerRef.current, {
        theme: isDarkTheme ? "dark" : "light",
        // Add these options to better control the appearance
        // align: "center",
        conversation: "none", // Hide the conversation
        dnt: true, // Do Not Track mode
      });

      setIsTweetLoading(false);
      isTwitterScriptLoading = false;

      if (onLoad) {
        onLoad();
      }

      // Apply background style to fix white corners in dark mode
      if (isDarkTheme && wrapperRef.current) {
        // Find all iframes inside the container
        const iframes = wrapperRef.current.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
          // Add some styling to the iframe
          iframe.style.borderRadius = "12px";
          // If we could access the iframe content we would style it, but due to CORS restrictions
          // we need to handle this differently
        });
      }
    } catch (error) {
      if (onError) {
        onError(String(error));
      }
    }
  }, [onError, onLoad, tweetID, isDarkTheme]);

  // Watch for theme changes and refresh the tweet
  useEffect(() => {
    if (!isTweetLoading && containerRef.current) {
      // Clear the container
      containerRef.current.innerHTML = "";
      // Recreate the tweet with new theme settings
      void createTweet();
    }
  }, [theme, resolvedTheme, createTweet, isTweetLoading]);

  useEffect(() => {
    if (tweetID !== previousTweetIDRef.current) {
      setIsTweetLoading(true);

      if (isTwitterScriptLoading) {
        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT_URL;
        script.async = true;
        document.body?.appendChild(script);
        script.onload = createTweet;
        if (onError) {
          script.onerror = onError as OnErrorEventHandler;
        }
      } else {
        void createTweet();
      }

      if (previousTweetIDRef) {
        previousTweetIDRef.current = tweetID;
      }
    }
  }, [createTweet, onError, tweetID]);

  const isFocused = isSelected && isEditable;

  return (
    <div
      className="relative flex items-center justify-center"
      ref={wrapperRef}
      // Add custom styling for dark mode to help fix background issues
      // style={{
      //   background: isDarkTheme ? "rgb(21, 32, 43)" : "transparent",
      //   borderRadius: "12px",
      //   overflow: "hidden",
      //   padding: isDarkTheme ? "1px" : "0",
      // }}
    >
      <BlockWithAlignableContents
        className={{
          ...className,
          base: className.base + (isFocused ? " outline outline-blue-500" : ""),
        }}
        format={format}
        nodeKey={nodeKey}
      >
        {isTweetLoading ? (
          <div
            className={`flex justify-center ${isDarkTheme ? "text-white" : "text-black"}`}
          >
            {loadingComponent}
          </div>
        ) : null}
        <div
        className="md:w-[400px] md:h-[300px]"
          ref={containerRef}
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
          aria-label="Remove tweet"
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

export type SerializedTweetNode = Spread<
  {
    id: string;
  },
  SerializedDecoratorBlockNode
>;

export class TweetNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return "tweet";
  }

  static clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedTweetNode): TweetNode {
    return $createTweetNode(serializedNode.id).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedTweetNode {
    return {
      ...super.exportJSON(),
      id: this.getId(),
    };
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute("data-lexical-tweet-id")) {
          return null;
        }
        return {
          conversion: $convertTweetElement,
          priority: 2,
        };
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-tweet-id", this.__id);
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return { element };
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(): // _includeInert?: boolean | undefined,
  // _includeDirectionless?: false | undefined,
  string {
    return `https://x.com/i/web/status/${this.__id}`;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock ?? {};
    const className = {
      base: embedBlockTheme.base ?? "",
      focus: embedBlockTheme.focus ?? "",
    };
    return (
      <TweetComponent
        className={className}
        format={this.__format}
        loadingComponent="Loading..."
        nodeKey={this.getKey()}
        tweetID={this.__id}
      />
    );
  }
}

export function $createTweetNode(tweetID: string): TweetNode {
  return new TweetNode(tweetID);
}

export function $isTweetNode(
  node: TweetNode | LexicalNode | null | undefined,
): node is TweetNode {
  return node instanceof TweetNode;
}
