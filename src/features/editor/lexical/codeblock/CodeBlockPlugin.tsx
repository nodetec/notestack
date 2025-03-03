import { useEffect } from "react";

import { $createCodeNode, registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import { Button } from "~/components/ui/button";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { BracesIcon } from "lucide-react";

interface CodeBlockPluginProps {
  blockType: string;
}

export default function CodeBlockPlugin({ blockType }: CodeBlockPluginProps) {
  const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     registerCodeHighlighting(editor);
//   }, [editor]);

  const onAddCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Create the code block
        const codeNode = $createCodeNode();

        // Create paragraph nodes before and after
        const paragraphBefore = $createParagraphNode();
        const paragraphAfter = $createParagraphNode();

        // First transform selection to codeblock
        $setBlocksType(selection, () => codeNode);

        // Then insert paragraphs around it
        // Insert before
        codeNode.insertBefore(paragraphBefore);
        // Insert after
        codeNode.insertAfter(paragraphAfter);
      }
    });
  };

  return (
    <div className="flex gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        className={blockType === "code" ? "bg-primary/5" : ""}
        onClick={onAddCodeBlock}
      >
        <BracesIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
