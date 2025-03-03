import { useEffect, useRef } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
} from "lexical";

interface ScrollCenterCurrentLinePluginProps {
  viewportPercentage?: number;
}

export const ScrollCenterCurrentLinePlugin = ({
  viewportPercentage = 30,
}: ScrollCenterCurrentLinePluginProps) => {
  const [editor] = useLexicalComposerContext();
  const currentLineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return editor.registerCommand<string>(
      KEY_ENTER_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();
          if (children.length > 0) {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              const { focus } = selection;
              const focusNode = focus.getNode();
              const focusOffset = focus.offset;

              const anchorNode = selection.anchor.getNode();
              const blockNode = anchorNode.getTopLevelElementOrThrow();
              const blockKey = blockNode.getKey();
              const blockElement = editor.getElementByKey(blockKey);

              // Detect and print out the part of the viewport that the cursor is in
              const domNode = editor.getElementByKey(focusNode.getKey());
              if (domNode) {
                const rect = domNode.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const cursorPosition = rect.top + focusOffset;
                const threshold = viewportHeight * (viewportPercentage / 100);

                if (cursorPosition > viewportHeight - threshold) {
                  // console.log(
                  //   `Cursor is in the bottom ${viewportPercentage}% of the viewport`,
                  // );
                  requestAnimationFrame(() => {
                    currentLineRef.current = blockElement as HTMLDivElement;
                    currentLineRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  });
                }
              }
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, viewportPercentage]);

  return null;
};
