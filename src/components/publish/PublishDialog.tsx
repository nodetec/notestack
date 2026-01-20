'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { publishArticle } from '@/lib/nostr/publish';
import type { LinkedBlog } from '@/lib/stores/draftStore';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  getContent: () => string;
  onPublishSuccess?: () => void;
  linkedBlog?: LinkedBlog;
}

interface RelayStatus {
  relay: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export default function PublishDialog({ isOpen, onClose, getContent, onPublishSuccess, linkedBlog }: PublishDialogProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [image, setImage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const relays = useSettingsStore((state) => state.relays);

  const isEditing = !!linkedBlog;

  // Extract title from markdown content (first # heading)
  const extractTitleFromMarkdown = (markdown: string): string => {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '';
  };

  // Track if dialog was previously open to detect open transition
  const wasOpenRef = useRef(false);

  // Reset form only when dialog first opens (not when linkedBlog changes while open)
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (justOpened) {
      if (linkedBlog) {
        setTitle(linkedBlog.title || '');
        setSummary(linkedBlog.summary || '');
        setImage(linkedBlog.image || '');
        setTags(linkedBlog.tags || []);
      } else {
        // Try to extract title from markdown content
        const content = getContent();
        const extractedTitle = extractTitleFromMarkdown(content);
        setTitle(extractedTitle);
        setSummary('');
        setImage('');
        setTags([]);
      }
      setTagInput('');
      setIsPublishing(false);
      setPublishComplete(false);
      setRelayStatuses([]);
      setError(null);
    }
  }, [isOpen, linkedBlog, getContent]);

  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isPublishing) return;

    setIsPublishing(true);
    setError(null);
    setRelayStatuses(relays.map((relay) => ({ relay, status: 'pending' })));

    try {
      const content = getContent();
      const results = await publishArticle({
        content,
        title: title.trim(),
        summary: summary.trim() || undefined,
        image: image.trim() || undefined,
        tags,
        relays,
        dTag: linkedBlog?.dTag, // Use existing d tag for edits
      });

      setRelayStatuses(
        results.map((r) => ({
          relay: r.relay,
          status: r.success ? 'success' : 'error',
          message: r.message,
        }))
      );

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        setPublishComplete(true);
        onPublishSuccess?.();
      } else {
        setError('Failed to publish to any relay');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
      setRelayStatuses(relays.map((relay) => ({ relay, status: 'error', message: 'Failed' })));
    } finally {
      setIsPublishing(false);
    }
  };

  const successCount = relayStatuses.filter((r) => r.status === 'success').length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPublishing && onClose()}>
      <DialogContent showCloseButton={!isPublishing}>
        <DialogHeader>
          <DialogTitle>
            {publishComplete ? 'Published!' : isEditing ? 'Publish Edit' : 'Publish Article'}
          </DialogTitle>
        </DialogHeader>

        {publishComplete ? (
          // Success state
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-600 dark:text-green-400"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              Successfully published to {successCount} relay{successCount !== 1 ? 's' : ''}
            </p>

            {/* Relay results */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {relayStatuses.map((rs) => (
                <div
                  key={rs.relay}
                  className="flex items-center gap-2 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded"
                >
                  {rs.status === 'success' ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-500 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-red-500 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                  )}
                  <span className={`truncate ${rs.status === 'success' ? 'text-zinc-600 dark:text-zinc-400' : 'text-red-500'}`}>
                    {rs.relay}
                  </span>
                  {rs.message && (
                    <span className="text-red-500 ml-auto flex-shrink-0">({rs.message})</span>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                disabled={isPublishing}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                required
                autoComplete="off"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief description of your article"
                rows={3}
                disabled={isPublishing}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50"
                autoComplete="off"
              />
            </div>

            {/* Thumbnail Image */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isPublishing}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                autoComplete="url"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag"
                  disabled={isPublishing}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isPublishing}
                >
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={isPublishing}
                        className="hover:text-red-500 disabled:opacity-50"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Relays */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Publishing to {relays.length} relay{relays.length !== 1 ? 's' : ''}
              </label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {(isPublishing ? relayStatuses : relays.map((relay) => ({ relay, status: 'pending' as const }))).map((rs) => (
                  <div
                    key={rs.relay}
                    className="flex items-center gap-2 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
                  >
                    {isPublishing ? (
                      rs.status === 'pending' ? (
                        <svg
                          className="animate-spin h-3 w-3 text-purple-500 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : rs.status === 'success' ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-green-500 flex-shrink-0"
                          aria-hidden="true"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      ) : (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-red-500 flex-shrink-0"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="m15 9-6 6" />
                          <path d="m9 9 6 6" />
                        </svg>
                      )
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-500 flex-shrink-0"
                        aria-hidden="true"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                    <span className="truncate">{rs.relay}</span>
                  </div>
                ))}
              </div>
              {relays.length === 0 && (
                <p className="text-xs text-red-500">
                  No relays configured. Add relays in Settings.
                </p>
              )}
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || relays.length === 0 || isPublishing}
              >
                {isPublishing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Publishing...
                  </>
                ) : isEditing ? (
                  'Publish Edit'
                ) : (
                  'Publish'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
