'use client';

import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AudioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}

export default function AudioDialog({ isOpen, onClose, onInsert }: AudioDialogProps) {
  const [url, setUrl] = useState('');

  const handleInsert = useCallback(() => {
    if (!url.trim()) return;
    onInsert(url.trim());
    setUrl('');
    onClose();
  }, [url, onInsert, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInsert();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Audio</DialogTitle>
          <DialogDescription>
            Paste an audio file URL to embed a player.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/audio.mp3"
          autoFocus
        />
        <Button
          type="submit"
          variant="default"
          disabled={!url.trim()}
          onClick={handleInsert}
        >
          Insert
        </Button>
      </DialogContent>
    </Dialog>
  );
}
