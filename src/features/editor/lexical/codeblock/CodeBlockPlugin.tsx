import { $createCodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import { Button } from "~/components/ui/button";
import { $getSelection, $isRangeSelection } from "lexical";
import { SquareCodeIcon } from "lucide-react";

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

        // First transform selection to codeblock
        $setBlocksType(selection, () => codeNode);
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
        <SquareCodeIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
