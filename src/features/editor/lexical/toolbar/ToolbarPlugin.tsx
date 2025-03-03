import React, { Fragment, useEffect, useState } from "react";

import { $isListNode, ListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { Layers3 } from "lucide-react";
import Link from "next/link";

import { PublishDialog } from "../../components/PublishDialog";
import MarkdownImagePlugin from "../markdownImage/ImageActions";
import { InsertProfileButton } from "../nostrProfile/ProfilePlugin";
import TwitterAction from "../tweet/TwitterActions";
import YoutubeAction from "../youtube/YouTubeActions";
import { LOW_PRIORIRTY, RICH_TEXT_OPTIONS, RichTextAction } from "./constants";
import { useKeyBinds } from "./hooks/useKeybinds";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [disableMap, setDisableMap] = useState<Record<string, boolean>>({
    [RichTextAction.Undo]: true,
    [RichTextAction.Redo]: true,
  });
  const [selectionMap, setSelectionMap] = useState<Record<string, boolean>>({});

  const blockTypeToName: Record<string, string> = {
    paragraph: "Paragraph",
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    // Add more mappings if needed
  };

  type BlockType = keyof typeof blockTypeToName;

  const [blockType, setBlockType] = useState<BlockType>("paragraph");

  // Use useCallback to memoize the updateToolbar function
  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const newSelectionMap = {
        [RichTextAction.Bold]: selection.hasFormat("bold"),
        [RichTextAction.Italics]: selection.hasFormat("italic"),
        [RichTextAction.Underline]: selection.hasFormat("underline"),
        [RichTextAction.Strikethrough]: selection.hasFormat("strikethrough"),
        [RichTextAction.Code]: selection.hasFormat("code"),
      };
      setSelectionMap(newSelectionMap);

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (!elementDOM) return;

      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        const type = parentList ? parentList.getTag() : element.getTag();
        setBlockType(type as BlockType);
      } else {
        const type = $isHeadingNode(element)
          ? element.getTag()
          : element.getType();
        setBlockType(type);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LOW_PRIORIRTY,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setDisableMap((prevDisableMap) => ({
            ...prevDisableMap,
            undo: !payload,
          }));
          return false;
        },
        LOW_PRIORIRTY,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setDisableMap((prevDisableMap) => ({
            ...prevDisableMap,
            redo: !payload,
          }));
          return false;
        },
        LOW_PRIORIRTY,
      ),
    );
  }, [editor, updateToolbar]);

  const onAction = (id: RichTextAction) => {
    switch (id) {
      case RichTextAction.Bold: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        break;
      }
      case RichTextAction.Italics: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        break;
      }
      case RichTextAction.Underline: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        break;
      }
      case RichTextAction.Strikethrough: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        break;
      }
      case RichTextAction.Code: {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        break;
      }
      case RichTextAction.Undo: {
        editor.dispatchCommand(UNDO_COMMAND, undefined);
        break;
      }
      case RichTextAction.Redo: {
        editor.dispatchCommand(REDO_COMMAND, undefined);
        break;
      }
    }
  };

  useKeyBinds({ onAction });

  const updateFormat = (heading: HeadingTagType | "paragraph") => {
    editor.update(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        if (heading === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(heading));
        }
      }
    });
  };

  return (
    <div className="flex w-full max-w-6xl items-center gap-8 py-4 md:px-16">
      <Link href="/" className="hidden items-center gap-2 md:flex">
        <Layers3 className="h-5 w-5" />
        <span className="font-merriweather text-xl font-bold">NoteStack</span>
      </Link>
      <div className="flex w-full items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-[110px] justify-start"
              size="sm"
              variant="outline"
            >
              {blockTypeToName[blockType] ?? "Paragraph"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => updateFormat("paragraph")}>
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFormat("h1")}>
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFormat("h2")}>
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateFormat("h3")}>
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden items-center gap-2 lg:flex">
          {RICH_TEXT_OPTIONS.map(({ id, icon }, index) =>
            id === RichTextAction.Divider ? (
              <Separator
                orientation="vertical"
                className="h-4"
                key={`${id}-${index}`}
              />
            ) : (
              <Button
                key={`${id}-${index}`}
                className={cn(selectionMap[id] && "bg-primary/5")}
                size="icon-sm"
                variant="ghost"
                onClick={() => onAction(id)}
                disabled={disableMap[id]}
              >
                {icon}
              </Button>
            ),
          )}
        </div>
        <MarkdownImagePlugin />
        <TwitterAction />
        <YoutubeAction />
        {/* <InsertProfileButton /> */}
      </div>
      <PublishDialog />
    </div>
  );
}
