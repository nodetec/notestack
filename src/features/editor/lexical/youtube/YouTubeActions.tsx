import React, { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
} from "lexical";
import { $createYouTubeNode, YouTubeNode } from "~/editor/nodes/YouTubeNode";
import { YoutubeIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { $createParagraphNode } from "lexical";

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_YOUTUBE_COMMAND"
);

export default function YoutubeAction() {
  const [url, setURL] = useState("");

  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        // Create paragraph nodes before and after
        const paragraphBefore = $createParagraphNode();
        const paragraphAfter = $createParagraphNode();

        // Insert all three nodes
        $insertNodeToNearestRoot(paragraphBefore);
        paragraphBefore.insertAfter(youTubeNode);
        youTubeNode.insertAfter(paragraphAfter);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  const onEmbed = () => {
    if (!url) return;
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);

    const id = match && match?.[2]?.length === 11 ? match?.[2] : null;
    if (!id) return;
    editor.update(() => {
      const youTubeNode = $createYouTubeNode(id);

      // Create paragraph nodes before and after
      const paragraphBefore = $createParagraphNode();
      const paragraphAfter = $createParagraphNode();

      // Insert all three nodes as a group
      $insertNodes([paragraphBefore, youTubeNode, paragraphAfter]);
    });
    setURL("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex gap-1 w-full p-2 justify-start" variant="ghost">
          <YoutubeIcon />
          YouTube Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>
            Paste a YouTube URL to embed it in your document.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={url}
          onChange={(e) => setURL(e.target.value)}
          placeholder="Add Youtube URL"
        />

        <Button type="submit" variant="ghost" disabled={!url} onClick={onEmbed}>
          Embed
        </Button>
      </DialogContent>
    </Dialog>
  );
}
