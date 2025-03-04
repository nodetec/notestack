import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";

import { $createProfileNode } from "./NostrProfileNode";

// Same regex used in the transformer to ensure consistency
const PROFILE_REGEX = /(npub1[a-z0-9]{58,})/g;

export function ProfilePastePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Override Lexical's paste
    const removePasteOverride = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData("text/plain")?.trim();
        if (!text) return false;

        // ...existing PROFILE_REGEX code...
        const matches = Array.from(text.matchAll(PROFILE_REGEX));
        if (matches.length === 1 && matches[0] && matches[0][0] === text) {
          const npub = matches[0][1] ?? "";
          editor.update(() => {
            // ...existing code for removing text and inserting a ProfileNode...
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;
            if (!selection.isCollapsed()) {
              selection.removeText();
            }
            const profileNode = $createProfileNode(npub);
            selection.insertNodes([profileNode]);
          });
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      removePasteOverride();
    };
  }, [editor]);

  return null;
}
