'use client';

import { useState, useEffect } from 'react';
import { XIcon, FileEditIcon, Trash2Icon, PenLineIcon } from 'lucide-react';
import { useDraftStore, type Draft } from '@/lib/stores/draftStore';
import { useSidebar } from '@/components/ui/sidebar';
import { extractFirstImage } from '@/lib/utils/markdown';

interface DraftsPanelProps {
  onSelectDraft?: (draftId: string) => void;
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function extractPreview(content: string): { title: string; preview: string } {
  const lines = content.split('\n').filter((line) => line.trim());

  // Try to extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Draft';

  // Get preview from non-heading content
  const previewLines = lines
    .filter((line) => !line.startsWith('#'))
    .slice(0, 2)
    .join(' ')
    .slice(0, 100);

  return { title, preview: previewLines || 'No content' };
}

export default function DraftsPanel({ onSelectDraft, onClose }: DraftsPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const drafts = useDraftStore((state) => state.drafts);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const { state: sidebarState, isMobile } = useSidebar();

  // Convert drafts object to sorted array (most recent first)
  // Keep linked drafts (edits to published blogs) even if empty
  const draftsList: Draft[] = Object.values(drafts)
    .filter((draft) => draft.content.trim().length > 0 || draft.linkedBlog)
    .sort((a, b) => b.lastSaved - a.lastSaved);

  const hasDrafts = isHydrated && draftsList.length > 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleDelete = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this draft?')) {
      deleteDraft(draftId);
    }
  };

  return (
    <div
      className="fixed inset-y-0 z-20 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Drafts
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          title="Close panel"
          aria-label="Close panel"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Drafts List */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isHydrated && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            Loading...
          </div>
        )}

        {isHydrated && !hasDrafts && (
          <div className="p-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
            <FileEditIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No drafts</p>
            <p className="text-xs mt-1">Start writing and your work will be auto-saved here.</p>
          </div>
        )}

        {hasDrafts && (
          <ul className="divide-y divide-sidebar-border">
            {draftsList.map((draft) => {
              const { title, preview } = extractPreview(draft.content);
              const isLinked = !!draft.linkedBlog;
              const thumbnail = extractFirstImage(draft.content);
              return (
                <li key={draft.id} className="relative group">
                  <button
                    onClick={() => onSelectDraft?.(draft.id)}
                    className="w-full text-left p-3 pr-10 hover:bg-sidebar-accent transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {title}
                        </h3>
                        {isLinked && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded" title="Editing published article">
                            <PenLineIcon className="w-3 h-3" />
                            Editing
                          </span>
                        )}
                      </div>
                      {preview && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {preview}
                        </p>
                      )}
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className="max-h-32 rounded object-contain mt-2"
                        />
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>Last saved {formatDate(draft.lastSaved)}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDelete(draft.id, e)}
                    className="absolute right-2 top-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-all"
                    aria-label="Delete draft"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
