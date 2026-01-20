'use client';

import { useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, $createParagraphNode } from 'lexical';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { $createYouTubeNode } from '../nodes/YouTubeNode';

interface YouTubeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracts YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
  return match?.[2] && match[2].length === 11 ? match[2] : null;
}

export default function YouTubeDialog({ isOpen, onClose }: YouTubeDialogProps) {
  const [editor] = useLexicalComposerContext();
  const [url, setUrl] = useState('');

  const handleEmbed = () => {
    if (!url) return;

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return;

    editor.update(() => {
      const youTubeNode = $createYouTubeNode(videoId);
      const paragraphAfter = $createParagraphNode();
      $insertNodes([youTubeNode, paragraphAfter]);
      paragraphAfter.selectStart();
    });

    setUrl('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmbed();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
          <DialogDescription>
            Paste a YouTube URL to embed it in your document.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://www.youtube.com/watch?v=..."
          autoFocus
        />

        <Button
          type="submit"
          variant="default"
          disabled={!url}
          onClick={handleEmbed}
        >
          Embed
        </Button>
      </DialogContent>
    </Dialog>
  );
}
