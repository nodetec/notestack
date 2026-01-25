'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EventJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: unknown | null;
  title?: string;
}

export default function EventJsonDialog({
  open,
  onOpenChange,
  event,
  title = 'Raw event JSON',
}: EventJsonDialogProps) {
  const json = event ? JSON.stringify(event, null, 2) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto rounded-md border border-border bg-muted/40 p-3">
          <pre className="whitespace-pre text-xs font-mono text-foreground/90">{json}</pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
