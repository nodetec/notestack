'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useDraftStore } from '../stores/draftStore';

const DEBOUNCE_MS = 500;

export function useDraftAutoSave(draftId: string | null) {
  const { setDraftContent, setSaveStatus, markSaved, saveStatus } = useDraftStore();
  // Use a selector to properly subscribe to draft changes
  const draft = useDraftStore((state) => draftId ? state.drafts[draftId] : undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  const handleContentChange = useCallback((newContent: string) => {
    if (!draftId) return;

    // Skip if content hasn't changed
    if (newContent === lastContentRef.current) return;
    lastContentRef.current = newContent;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mark as unsaved immediately
    setSaveStatus('unsaved');

    // Debounce the actual save
    timeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      setDraftContent(draftId, newContent);
      markSaved(draftId);

      // Auto-hide "Saved" after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, DEBOUNCE_MS);
  }, [draftId, setDraftContent, setSaveStatus, markSaved]);

  // Update lastContentRef when draft changes
  useEffect(() => {
    if (draft) {
      lastContentRef.current = draft.content;
    }
  }, [draft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleContentChange, saveStatus, draft };
}
