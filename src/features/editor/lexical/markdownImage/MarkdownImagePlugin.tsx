import React, { useCallback, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
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
import { Label } from "~/components/ui/label";
import { $createParagraphNode, $insertNodes } from "lexical";
import { ImageIcon } from "lucide-react";

import { useImageInsertCommand } from "./hooks/useImageInsertCommand";
import { useMarkdownImagePaste } from "./hooks/useMarkdownImagePaste";
import { $createMarkdownImageNode } from "./nodes/MarkdownImageNode";

export { INSERT_IMAGE_COMMAND } from "./hooks/useImageInsertCommand";

export function MarkdownImagePlugin() {
  const [editor] = useLexicalComposerContext();
  useImageInsertCommand(editor);
  useMarkdownImagePaste(editor);
  const [src, setSrc] = useState("");
  const [altText, setAltText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleInsertImage = useCallback(() => {
    if (imageFile) {
      // Simple file upload without resizing
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        editor.update(() => {
          const imageNode = $createMarkdownImageNode({
            src: dataUrl,
            altText,
          });

          // Create a paragraph node after for better editing experience
          const paragraphAfter = $createParagraphNode();

          // Insert nodes
          $insertNodes([imageNode, paragraphAfter]);
        });

        // Reset state
        setImageFile(null);
        setAltText("");
        setSrc("");
        setIsOpen(false);
      };
      reader.readAsDataURL(imageFile);
    } else if (src) {
      // For URLs
      editor.update(() => {
        const imageNode = $createMarkdownImageNode({
          src,
          altText,
        });

        // Create a paragraph node after for better editing experience
        const paragraphAfter = $createParagraphNode();

        // Insert nodes
        $insertNodes([imageNode, paragraphAfter]);
      });

      // Reset state
      setAltText("");
      setSrc("");
      setIsOpen(false);
    }
  }, [editor, imageFile, src, altText]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="ghost">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image or provide a URL
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* <div className="grid gap-2">
            <Label htmlFor="file">Upload Image</Label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div> */}

          <div className="grid gap-2">
            <Label htmlFor="url">Or Image URL</Label>
            <Input
              id="url"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="alt">Alt Text</Label>
            <Input
              id="alt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Description of the image"
            />
          </div>
        </div>

        <Button
          variant="default"
          onClick={handleInsertImage}
          disabled={!imageFile && !src}
        >
          Insert Image
        </Button>
      </DialogContent>
    </Dialog>
  );
}
