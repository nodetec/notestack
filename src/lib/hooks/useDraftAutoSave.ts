'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useDraftStore, type Draft } from '../stores/draftStore';
import { useShallow } from 'zustand/react/shallow';

const DEBOUNCE_MS = 500;

export function useDraftAutoSave(draftId: string | null) {
  const { setDraftContent, setSaveStatus, markSaved } = useDraftStore();

  // Subscribe to draft with shallow comparison to avoid re-renders when only content changes
  // We only need linkedBlog for the UI - content is managed by the editor
  const draft = useDraftStore(
    useShallow((state) => {
      if (!draftId) return undefined;
      const d = state.drafts[draftId];
      if (!d) return undefined;
      // Return a stable reference that only changes when linkedBlog changes
      return { id: d.id, linkedBlog: d.linkedBlog } as Draft;
    })
  );

  // Track initial content separately (doesn't trigger re-renders)
  const initialContentRef = useRef<string>('');
  const hasInitializedRef = useRef(false);

  // Initialize content ref when draft first loads
  useEffect(() => {
    if (draftId && !hasInitializedRef.current) {
      const fullDraft = useDraftStore.getState().drafts[draftId];
      if (fullDraft) {
        initialContentRef.current = fullDraft.content;
        hasInitializedRef.current = true;
      }
    }
    // Reset when switching drafts
    if (!draftId) {
      hasInitializedRef.current = false;
      initialContentRef.current = '';
    }
  }, [draftId]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleContentChange, draft };
}
