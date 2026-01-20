'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { NostrEditor, type NostrEditorHandle } from '@/components/editor';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import BlogListPanel from '@/components/sidebar/BlogListPanel';
import DraftsPanel from '@/components/sidebar/DraftsPanel';
import SettingsPanel from '@/components/sidebar/SettingsPanel';
import GlobalFeedPanel from '@/components/sidebar/GlobalFeedPanel';
import LoginButton from '@/components/auth/LoginButton';
import PublishDialog from '@/components/publish/PublishDialog';
import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/authStore';
import { useDraftStore } from '@/lib/stores/draftStore';
import { useDraftAutoSave } from '@/lib/hooks/useDraftAutoSave';
import { lookupProfile } from '@/lib/nostr/profiles';
import { lookupNote } from '@/lib/nostr/notes';
import { fetchBlogByAddress } from '@/lib/nostr/fetch';
import { blogToNaddr, decodeNaddr } from '@/lib/nostr/naddr';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Blog } from '@/lib/nostr/types';


function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const pubkey = useAuthStore((state) => state.pubkey);
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const editorRef = useRef<NostrEditorHandle>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarElement, setToolbarElement] = useState<HTMLDivElement | null>(null);
  const hasUserTyped = useRef(false);
  const checkBlogForEditsRef = useRef<() => void>(() => {});
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect toolbar ref to state once after mount
  useEffect(() => {
    setToolbarElement(toolbarRef.current);
  }, []);
  const queryClient = useQueryClient();

  // Get draft ID from URL or create new one
  const urlDraftId = searchParams.get('draft');
  const urlBlogId = searchParams.get('blog');
  const createDraft = useDraftStore((state) => state.createDraft);
  const createDraftFromBlog = useDraftStore((state) => state.createDraftFromBlog);
  const getDraft = useDraftStore((state) => state.getDraft);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const findDraftByLinkedBlog = useDraftStore((state) => state.findDraftByLinkedBlog);

  // Determine current draft ID
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const { handleContentChange, draft } = useDraftAutoSave(currentDraftId);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handle URL-based navigation
  useEffect(() => {
    if (!isHydrated) return;

    if (urlBlogId) {
      // Viewing a blog - check if we already have a draft for it
      const naddrData = decodeNaddr(urlBlogId);
      if (naddrData) {
        // Check if we already have a draft for this blog
        const existingDraft = findDraftByLinkedBlog(naddrData.pubkey, naddrData.identifier);
        if (existingDraft) {
          // Redirect to existing draft
          router.replace(`/?draft=${existingDraft.id}`);
          return;
        }

        // Check if we already have this blog loaded
        if (selectedBlog?.pubkey === naddrData.pubkey && selectedBlog?.dTag === naddrData.identifier) {
          return;
        }

        // Load blog without creating a draft
        setSelectedBlog(null);
        setCurrentDraftId(null);
        setIsLoadingBlog(true);

        // Try relays in order: naddr hint, active relay, then all configured relays
        const relaysToTry = [
          ...naddrData.relays,
          activeRelay,
          ...relays.filter(r => r !== activeRelay && !naddrData.relays.includes(r))
        ].filter(Boolean);

        // Try each relay until we find the blog
        const tryFetchFromRelays = async (relayList: string[]): Promise<Blog | null> => {
          for (const relay of relayList) {
            const blog = await fetchBlogByAddress({
              pubkey: naddrData.pubkey,
              identifier: naddrData.identifier,
              relay,
            });
            if (blog) return blog;
          }
          return null;
        };

        tryFetchFromRelays(relaysToTry).then((blog) => {
          setIsLoadingBlog(false);
          if (blog) {
            setSelectedBlog(blog);
          } else {
            // Blog not found on any relay, redirect to new draft
            const newId = createDraft();
            router.replace(`/?draft=${newId}`);
          }
        });
      } else {
        // Invalid naddr, redirect to new draft
        const newId = createDraft();
        router.replace(`/?draft=${newId}`);
      }
    } else if (urlDraftId) {
      // Viewing a draft
      setSelectedBlog(null);
      const existingDraft = getDraft(urlDraftId);
      if (existingDraft) {
        setCurrentDraftId(urlDraftId);
      } else {
        // Draft doesn't exist, create new and redirect
        const newId = createDraft();
        router.replace(`/?draft=${newId}`);
      }
    } else {
      // No draft or blog in URL - create new draft
      const newId = createDraft();
      router.replace(`/?draft=${newId}`);
    }
  }, [isHydrated, urlDraftId, urlBlogId, getDraft, createDraft, findDraftByLinkedBlog, router, relays, selectedBlog]);

  const handleSelectBlog = useCallback((blog: Blog) => {
    // Check for unsaved edits before navigating
    checkBlogForEditsRef.current();
    const naddr = blogToNaddr(blog, relays);
    router.push(`/?blog=${naddr}`);
    if (isMobile) setActivePanel(null);
  }, [router, relays, isMobile]);

  const getEditorContent = useCallback(() => {
    return editorRef.current?.getMarkdown() ?? '';
  }, []);

  const [justPublished, setJustPublished] = useState(false);

  const handlePublishSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['blogs'] });
    setJustPublished(true);
  }, [queryClient]);

  const handlePublishDialogClose = useCallback(() => {
    setShowPublishDialog(false);

    // Clean up after successful publish when dialog closes
    if (justPublished) {
      setJustPublished(false);
      if (currentDraftId) {
        deleteDraft(currentDraftId);
      }
      setSelectedBlog(null);
      const newId = createDraft();
      router.replace(`/?draft=${newId}`);
    }
  }, [justPublished, currentDraftId, deleteDraft, createDraft, router]);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleNewArticle = useCallback(() => {
    checkBlogForEditsRef.current();
    const newId = createDraft();
    router.push(`/?draft=${newId}`);
    if (isMobile) setActivePanel(null);
  }, [createDraft, router, isMobile]);

  const handleSelectDraft = useCallback((draftId: string) => {
    checkBlogForEditsRef.current();
    router.push(`/?draft=${draftId}`);
    if (isMobile) setActivePanel(null);
  }, [router, isMobile]);

  const isLoggedIn = isHydrated && !!pubkey;

  // Determine if we're editing an existing blog (only when we have a draft with actual edits)
  const isEditing = !!draft?.linkedBlog;

  // Determine editor content and key
  const editorContent = selectedBlog ? selectedBlog.content : (draft?.content ?? '');
  // Use consistent key format based on blog identity (pubkey:dTag) to prevent remount when transitioning from blog to draft
  const blogIdentityKey = selectedBlog ? `${selectedBlog.pubkey}:${selectedBlog.dTag}` : null;
  const linkedBlogKey = draft?.linkedBlog ? `${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}` : null;
  const editorKey = blogIdentityKey || linkedBlogKey || currentDraftId || 'new';

  // Reset hasUserTyped when switching to a different article
  useEffect(() => {
    hasUserTyped.current = false;
  }, [editorKey]);

  // Track when user actually types and create draft on first edit
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (hasUserTyped.current) return; // Already handled

    // Ignore non-content-modifying keys
    const ignoredKeys = [
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown',
      'Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    ];
    if (ignoredKeys.includes(e.key)) return;

    hasUserTyped.current = true;

    // If viewing a blog, create draft on first content-modifying keystroke
    if (selectedBlog && editorRef.current) {
      // Small delay to let the keystroke be processed first
      setTimeout(() => {
        const markdown = editorRef.current?.getMarkdown() ?? '';
        const draftId = createDraftFromBlog(markdown, {
          pubkey: selectedBlog.pubkey,
          dTag: selectedBlog.dTag,
          title: selectedBlog.title,
          summary: selectedBlog.summary,
          image: selectedBlog.image,
          tags: selectedBlog.tags,
        });
        router.replace(`/?draft=${draftId}`);
      }, 0);
    }
  }, [selectedBlog, createDraftFromBlog, router]);

  // Normalize content for comparison - aggressively strip formatting differences
  const normalizeForComparison = (content: string) => {
    return content
      // Normalize whitespace and line endings
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/[ \t]+/g, ' ')        // Collapse multiple spaces to one
      .replace(/\n{2,}/g, '\n')       // Collapse multiple newlines to one
      // Strip all escape characters
      .replace(/\\([_*.\[\]()#`~>+-])/g, '$1')
      // Strip formatting markers (bold, italic)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Strip blockquote markers
      .replace(/^>+ ?/gm, '')
      // Strip heading markers
      .replace(/^#{1,6} /gm, '')
      // Strip list markers
      .replace(/^[-*+] /gm, '')
      .replace(/^\d+\. /gm, '')
      // Clean up
      .replace(/\n+/g, '\n')          // Collapse newlines again after stripping
      .trim();
  };

  // Check if blog has been edited and create draft if so
  const checkBlogForEdits = useCallback(() => {
    if (!selectedBlog || !hasUserTyped.current) return;
    if (!editorRef.current) return;

    const markdown = editorRef.current?.getMarkdown() ?? '';
    const normalizedOriginal = normalizeForComparison(selectedBlog.content);
    const normalizedEditor = normalizeForComparison(markdown);

    if (normalizedEditor !== normalizedOriginal) {
      // DEBUG: Keep these logs to diagnose unexpected draft creation - DO NOT REMOVE
      console.group('Draft created from blog view');
      console.log('Blog title:', selectedBlog.title);
      console.log('Original length:', selectedBlog.content.length, '| Normalized:', normalizedOriginal.length);
      console.log('Editor length:', markdown.length, '| Normalized:', normalizedEditor.length);
      console.log('--- Normalized original ---');
      console.log(JSON.stringify(normalizedOriginal));
      console.log('--- Normalized editor ---');
      console.log(JSON.stringify(normalizedEditor));
      // Find first difference
      for (let i = 0; i < Math.max(normalizedOriginal.length, normalizedEditor.length); i++) {
        if (normalizedOriginal[i] !== normalizedEditor[i]) {
          console.log(`First difference at index ${i}:`);
          console.log(`  Original char: ${JSON.stringify(normalizedOriginal[i])} (code: ${normalizedOriginal.charCodeAt(i)})`);
          console.log(`  Editor char: ${JSON.stringify(normalizedEditor[i])} (code: ${normalizedEditor.charCodeAt(i)})`);
          console.log(`  Context original: ${JSON.stringify(normalizedOriginal.slice(Math.max(0, i - 20), i + 20))}`);
          console.log(`  Context editor: ${JSON.stringify(normalizedEditor.slice(Math.max(0, i - 20), i + 20))}`);
          break;
        }
      }
      console.groupEnd();

      const draftId = createDraftFromBlog(markdown, {
        pubkey: selectedBlog.pubkey,
        dTag: selectedBlog.dTag,
        title: selectedBlog.title,
        summary: selectedBlog.summary,
        image: selectedBlog.image,
        tags: selectedBlog.tags,
      });
      router.replace(`/?draft=${draftId}`);
    }
  }, [selectedBlog, createDraftFromBlog, router]);

  // Keep ref updated so navigation handlers can call it
  useEffect(() => {
    checkBlogForEditsRef.current = checkBlogForEdits;
  }, [checkBlogForEdits]);

  // Handle editor changes - only for draft autosave
  const handleEditorChange = useCallback(() => {
    // For blogs: handled by keydown, not onChange
    if (selectedBlog) return;

    // For drafts: debounce the expensive getMarkdown call
    if (currentDraftId) {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
      draftSaveTimeoutRef.current = setTimeout(() => {
        const markdown = editorRef.current?.getMarkdown() ?? '';
        handleContentChange(markdown);
      }, 300);
    }
  }, [selectedBlog, currentDraftId, handleContentChange]);

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar activePanel={activePanel} onPanelChange={setActivePanel} onNewArticle={handleNewArticle} />

      {/* Collapsible panels - kept mounted to preserve scroll position */}
      <div className={activePanel === 'explore' ? '' : 'hidden'}>
        <GlobalFeedPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'blogs' ? '' : 'hidden'}>
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'drafts' ? '' : 'hidden'}>
        <DraftsPanel onSelectDraft={handleSelectDraft} onClose={handleClosePanel} />
      </div>
      {activePanel === 'relays' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}

      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-10 flex-shrink-0 flex items-center justify-between px-2 sm:px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <SidebarTrigger className="md:hidden" />
            <SaveStatusIndicator className="hidden sm:flex" />
          </div>
          <div ref={toolbarRef} className="flex items-center justify-center flex-1 min-w-0" />
          <div className="flex items-center gap-1 sm:gap-2 justify-end flex-shrink-0">
            {isLoggedIn && selectedBlog && !currentDraftId && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const markdown = editorRef.current?.getMarkdown() ?? selectedBlog.content;
                  const draftId = createDraftFromBlog(markdown, {
                    pubkey: selectedBlog.pubkey,
                    dTag: selectedBlog.dTag,
                    title: selectedBlog.title,
                    summary: selectedBlog.summary,
                    image: selectedBlog.image,
                    tags: selectedBlog.tags,
                  });
                  router.replace(`/?draft=${draftId}`);
                }}
              >
                Edit
              </Button>
            )}
            {isLoggedIn && currentDraftId && (
              <Button
                size="sm"
                variant={isEditing ? 'success' : 'default'}
                onClick={() => setShowPublishDialog(true)}
              >
                {isEditing ? 'Publish Edit' : 'Publish'}
              </Button>
            )}
            <LoginButton />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto cursor-text">
          {isLoadingBlog ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              Loading...
            </div>
          ) : (
          <div className="min-h-full w-full max-w-3xl mx-auto flex flex-col">
            <NostrEditor
              ref={editorRef}
              key={editorKey}
              placeholder="What's on your mind?"
              initialMarkdown={editorContent}
              onChange={handleEditorChange}
              onProfileLookup={lookupProfile}
              onNoteLookup={lookupNote}
              toolbarContainer={selectedBlog ? null : toolbarElement}
              readOnly={!!selectedBlog}
            />
          </div>
          )}
        </div>
      </SidebarInset>

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={handlePublishDialogClose}
        getContent={getEditorContent}
        linkedBlog={draft?.linkedBlog || (selectedBlog ? {
          pubkey: selectedBlog.pubkey,
          dTag: selectedBlog.dTag,
          title: selectedBlog.title,
          summary: selectedBlog.summary,
          image: selectedBlog.image,
          tags: selectedBlog.tags,
        } : undefined)}
        onPublishSuccess={handlePublishSuccess}
      />
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
