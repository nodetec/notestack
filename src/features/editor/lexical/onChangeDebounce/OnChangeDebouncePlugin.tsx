import { useLayoutEffect, useRef } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState, LexicalEditor } from "lexical";

export function OnChangeDebouncePlugin({
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = true,
  onChange,
  debounceTime = 500,
}: {
  ignoreHistoryMergeTagChange?: boolean;
  ignoreSelectionChange?: boolean;
  onChange: (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => void;
  debounceTime?: number;
}): null {
  const [editor] = useLexicalComposerContext();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    if (onChange) {
      return editor.registerUpdateListener(
        ({
          editorState,
          dirtyElements,
          dirtyLeaves,
          prevEditorState,
          tags,
        }) => {
          if (
            (ignoreSelectionChange &&
              dirtyElements.size === 0 &&
              dirtyLeaves.size === 0) ||
            (ignoreHistoryMergeTagChange && tags.has("history-merge")) ||
            prevEditorState.isEmpty()
          ) {
            return;
          }

          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }

          debounceTimeout.current = setTimeout(() => {
            onChange(editorState, editor, tags);
          }, debounceTime);
        }
      );
    }
  }, [
    editor,
    ignoreHistoryMergeTagChange,
    ignoreSelectionChange,
    onChange,
    debounceTime,
  ]);

  return null;
}
