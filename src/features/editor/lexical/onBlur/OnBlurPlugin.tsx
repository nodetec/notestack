import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  BLUR_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  type LexicalEditor,
} from "lexical";

export function OnBlurPlugin({
  onBlur,
}: {
  onBlur: (event: FocusEvent, editor: LexicalEditor) => void;
}): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerCommand(
      BLUR_COMMAND,
      (event, editor) => {
        onBlur(event, editor);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, onBlur]);

  return null;
}
