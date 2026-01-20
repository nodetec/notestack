'use client';

import { useDraftStore } from '@/lib/stores/draftStore';
import { Loader2, Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  className?: string;
}

export function SaveStatusIndicator({ className }: SaveStatusIndicatorProps) {
  const saveStatus = useDraftStore((state) => state.saveStatus);

  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 min-w-0", className)}>
      {saveStatus === 'unsaved' && (
        <>
          <Circle className="h-2 w-2 fill-current" />
          <span>Unsaved</span>
        </>
      )}
      {saveStatus === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Saved</span>
        </>
      )}
    </div>
  );
}
