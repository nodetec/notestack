'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, altText: string) => void;
}

export default function ImageDialog({ isOpen, onClose, onInsert }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');

  const handleInsert = useCallback(() => {
    if (url.trim()) {
      onInsert(url.trim(), altText.trim());
      setUrl('');
      setAltText('');
      onClose();
    }
  }, [url, altText, onInsert, onClose]);

  const handleClose = useCallback(() => {
    setUrl('');
    setAltText('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image-alt">Alt Text (optional)</Label>
            <Input
              id="image-alt"
              type="text"
              placeholder="Description of the image"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!url.trim()}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
