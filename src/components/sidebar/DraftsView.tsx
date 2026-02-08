'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileEditIcon, Trash2Icon, PenLineIcon, RefreshCwIcon } from 'lucide-react';
import { useDraftStore, type Draft } from '@/lib/stores/draftStore';
import { extractFirstImage } from '@/lib/utils/markdown';
import { useAuth } from '@/lib/hooks/useAuth';
import { syncDrafts } from '@/lib/nostr/draftSync';
import { toast } from 'sonner';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { deleteDraft as deleteDraftEvent } from '@/lib/nostr/publish';

interface DraftsViewProps {
  onSelectDraft?: (draftId: string) => void;
  selectedDraftId?: string;
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

export default function DraftsView({
  onSelectDraft,
  selectedDraftId,
}: DraftsViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const drafts = useDraftStore((state) => state.drafts);
  const upsertDraftFromSync = useDraftStore((state) => state.upsertDraftFromSync);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const { publicKey, secretKey, isAuthenticated } = useAuth();
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);

  // Convert drafts object to sorted array (most recent first)
  // Keep linked drafts (edits to published blogs) even if empty
  const draftsList: Draft[] = Object.values(drafts)
    .filter((draft) => draft.content.trim().length > 0 || draft.linkedBlog || draft.id === selectedDraftId)
    .sort((a, b) => b.lastSaved - a.lastSaved);

  const hasDrafts = isHydrated && draftsList.length > 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleDelete = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this draft?')) {
      const draft = drafts[draftId];
      if (draft?.remoteEventId && isAuthenticated) {
        try {
          const results = await deleteDraftEvent({
            eventId: draft.remoteEventId,
            relays,
            secretKey,
          });
          const successCount = results.filter((result) => result.success).length;
          if (successCount === 0) {
            toast.error('Failed to delete draft from relay');
          }
        } catch (error) {
          toast.error('Failed to delete draft from relay', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } else if (draft?.remoteEventId && !isAuthenticated) {
        toast.error('Sign in to delete from relay');
      }
      deleteDraft(draftId);
    }
  };

  const handleSync = useCallback(async () => {
    if (!isAuthenticated || !publicKey) {
      toast.error('Sign in to sync drafts');
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncDrafts({
        drafts: Object.values(drafts),
        pubkey: publicKey,
        relays: activeRelay ? [activeRelay] : relays,
        secretKey,
        onDraftReceived: upsertDraftFromSync,
        onDraftDeleted: deleteDraft,
      });
      toast.success('Drafts synced', {
        description: `Received ${result.received}, updated ${result.updated}.`,
      });
    } catch (error) {
      toast.error('Failed to sync drafts', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [drafts, isAuthenticated, isSyncing, publicKey, relays, upsertDraftFromSync]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col bg-background px-4 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 border-b border-border/70 pt-2">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-sm font-medium text-foreground">
            Drafts
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
              title="Sync drafts"
              aria-label="Sync drafts"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!isHydrated && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Loading...
          </div>
        )}

        {isHydrated && !hasDrafts && (
          <div className="p-4 text-center text-muted-foreground text-sm">
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
              const isSelected = draft.id === selectedDraftId;
              return (
                <li key={draft.id} className="relative group py-2">
                  <button
                    onClick={() => onSelectDraft?.(draft.id)}
                    className={`w-full text-left py-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {title}
                        </h3>
                        {isLinked && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 dark:bg-primary/20 text-primary rounded" title="Editing published article">
                            <PenLineIcon className="w-3 h-3" />
                            Editing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
                        {preview}
                      </p>
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className="max-h-32 rounded object-contain mt-2"
                        />
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
                        <span>Last saved {formatDate(draft.lastSaved)}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDelete(draft.id, e)}
                    className="absolute right-2 top-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-sidebar-accent text-muted-foreground hover:text-red-500 transition-all"
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
