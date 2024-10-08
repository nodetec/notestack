import React, { useCallback, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  AiOutlineAlignCenter,
  AiOutlineAlignLeft,
  AiOutlineAlignRight,
  AiOutlineBold,
  AiOutlineItalic,
  AiOutlineRedo,
  AiOutlineStrikethrough,
  AiOutlineUnderline,
  AiOutlineUndo,
} from "react-icons/ai";

const LowPriority = 1;

export const ToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [align, setAlign] = useState<"left" | "center" | "right" | "">("");

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, $updateToolbar]);
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-border p-4 rounded-lg shadow-md flex gap-4" ref={toolbarRef}>
      <AiOutlineUndo
        className="text-2xl cursor-pointer"
        title="Undo"
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
      />
      <AiOutlineRedo
        className="text-2xl cursor-pointer"
        title="Redo"
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
      />
      <AiOutlineBold
        className={`text-2xl cursor-pointer ${isBold ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Bold"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
      />
      <AiOutlineItalic
        className={`text-2xl cursor-pointer ${isItalic ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Italic"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
      />
      <AiOutlineUnderline
        className={`text-2xl cursor-pointer ${isUnderline ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Underline"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
      />
      <AiOutlineStrikethrough
        className={`text-2xl cursor-pointer ${isStrikethrough ? "bg-gray-900 text-white rounded p-1" : ""}`}
        aria-label="Format Strikethrough"
        title="Strikethrough"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
      />
      <AiOutlineAlignLeft
        className={`text-2xl cursor-pointer ${align === "left" ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Align Left"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
      />
      <AiOutlineAlignCenter
        className={`text-2xl cursor-pointer ${align === "right" ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Align Center"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
      />
      <AiOutlineAlignRight
        className={`text-2xl cursor-pointer ${align === "center" ? "bg-gray-900 text-white rounded p-1" : ""}`}
        title="Align Right"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
      />
    </div>
  );
};
