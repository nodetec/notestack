import React, { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { TwitterIcon } from "lucide-react";

import { $createTweetNode, TweetNode } from "./TwitterNode";

export const INSERT_TWITTER_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_TWITTER_COMMAND",
);

export default function TwitterAction() {
  const [url, setURL] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Add state to control dialog open state
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([TweetNode])) {
      throw new Error("TwitterPlugin: TwitterNode not registered on editor");
    }

    return editor.registerCommand<string>(
      INSERT_TWITTER_COMMAND,
      (payload) => {
        const twitterNode = $createTweetNode(payload);
        // Create paragraph nodes before and after
        const paragraphBefore = $createParagraphNode();
        const paragraphAfter = $createParagraphNode();

        // Insert all three nodes
        $insertNodeToNearestRoot(paragraphBefore);
        paragraphBefore.insertAfter(twitterNode);
        twitterNode.insertAfter(paragraphAfter);

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  const onEmbed = () => {
    if (!url) return;

    // Extract tweet ID from URLs like:
    // https://twitter.com/username/status/1234567890123456789
    // https://x.com/username/status/1234567890123456789
    const match = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/.exec(url);

    let id = null;

    if (match?.[1]) {
      id = match[1];
    } else {
      // Try to extract just the ID if user pasted only the ID
      const idMatch = /^(\d{10,25})$/.exec(url);
      if (idMatch) {
        id = idMatch[1];
      }
    }

    if (!id) return;

    editor.update(() => {
      const twitterNode = $createTweetNode(id);

      // Create paragraph nodes before and after
      const paragraphBefore = $createParagraphNode();
      const paragraphAfter = $createParagraphNode();

      // Insert all three nodes as a group
      $insertNodes([paragraphBefore, twitterNode, paragraphAfter]);
    });

    setURL("");
    setIsOpen(false); // Close the dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost">
          <TwitterIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed Tweet</DialogTitle>
          <DialogDescription>
            Paste a Twitter/X URL or tweet ID to embed it in your document.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={url}
          onChange={(e) => setURL(e.target.value)}
          placeholder="https://twitter.com/username/status/1234567890123456789"
        />

        <Button
          type="submit"
          variant="default"
          disabled={!url}
          onClick={onEmbed}
        >
          Embed
        </Button>
      </DialogContent>
    </Dialog>
  );
}
