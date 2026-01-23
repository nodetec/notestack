'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NostrEditor, type NostrEditorHandle, type HighlightSource, type Highlight } from '@/components/editor';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import BlogListPanel from '@/components/sidebar/BlogListPanel';
import DraftsPanel from '@/components/sidebar/DraftsPanel';
import SettingsPanel from '@/components/sidebar/SettingsPanel';
import GlobalFeedPanel from '@/components/sidebar/GlobalFeedPanel';
import FollowingFeedPanel from '@/components/sidebar/FollowingFeedPanel';
import HighlightsPanel from '@/components/sidebar/HighlightsPanel';
import StacksPanel from '@/components/sidebar/StacksPanel';
import ProfilePanel from '@/components/sidebar/ProfilePanel';
import StackButton from '@/components/stacks/StackButton';
import ZapButton from '@/components/zap/ZapButton';
import LoginButton from '@/components/auth/LoginButton';
import PublishDialog from '@/components/publish/PublishDialog';
import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import { useDraftStore } from '@/lib/stores/draftStore';
import { useDraftAutoSave } from '@/lib/hooks/useDraftAutoSave';
import { lookupProfile, fetchProfiles } from '@/lib/nostr/profiles';
import { lookupNote } from '@/lib/nostr/notes';
import { fetchBlogByAddress, fetchHighlights } from '@/lib/nostr/fetch';
import { blogToNaddr, decodeNaddr } from '@/lib/nostr/naddr';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Blog } from '@/lib/nostr/types';
import { CommentsSection } from '@/components/comments';
import AuthorDropdown from '@/components/author/AuthorDropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BoldIcon, ItalicIcon, PencilRulerIcon, PenToolIcon, ToolCaseIcon, UnderlineIcon } from 'lucide-react';


function HomeContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Support ?panel=explore query param from landing page
  const initialPanel = searchParams.get('panel');
  const [activePanel, setActivePanel] = useState<string | null>(initialPanel);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const editorRef = useRef<NostrEditorHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
  const [floatingToolbarElement, setFloatingToolbarElement] = useState<HTMLDivElement | null>(null);
  const hasUserTyped = useRef(false);
  const checkBlogForEditsRef = useRef<() => void>(() => {});
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedBlogRef = useRef<Blog | null>(null); // Track current blog for useEffect without triggering re-runs

  // Connect floating toolbar ref to state when visible
  useEffect(() => {
    if (showFloatingToolbar) {
      setFloatingToolbarElement(floatingToolbarRef.current);
    } else {
      setFloatingToolbarElement(null);
    }
  }, [showFloatingToolbar]);
  const queryClient = useQueryClient();

  // Parse path params to get draft or blog ID
  const pathSegments = params.path as string[] | undefined;
  let urlDraftId: string | null = null;
  let urlBlogId: string | null = null;

  if (pathSegments && pathSegments.length > 0) {
    if (pathSegments[0] === 'draft' && pathSegments[1]) {
      urlDraftId = pathSegments[1];
    } else if (pathSegments[0]?.startsWith('naddr1')) {
      urlBlogId = pathSegments[0];
    }
  }

  const createDraft = useDraftStore((state) => state.createDraft);
  const createDraftFromBlog = useDraftStore((state) => state.createDraftFromBlog);
  const getDraft = useDraftStore((state) => state.getDraft);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);

  // Determine current draft ID
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const { handleContentChange, draft } = useDraftAutoSave(currentDraftId);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Keep selectedBlogRef in sync
  useEffect(() => {
    selectedBlogRef.current = selectedBlog;
  }, [selectedBlog]);

  // Fetch highlights when viewing a blog using React Query
  // Only fetch the logged-in user's highlights
  const highlightsQueryKey = selectedBlog && pubkey
    ? ['highlights', selectedBlog.pubkey, selectedBlog.dTag, activeRelay, pubkey]
    : null;

  const { data: highlights = [] } = useQuery({
    queryKey: highlightsQueryKey!,
    queryFn: () => fetchHighlights({
      articlePubkey: selectedBlog!.pubkey,
      articleIdentifier: selectedBlog!.dTag,
      relay: activeRelay,
      authors: [pubkey!],
    }),
    enabled: !!selectedBlog && !!pubkey,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch author profile when viewing a blog (only if not already embedded)
  const hasEmbeddedAuthor = !!(selectedBlog?.authorName || selectedBlog?.authorPicture);
  const { data: fetchedAuthorProfile, isLoading: isLoadingAuthor } = useQuery({
    queryKey: ['profile', selectedBlog?.pubkey, activeRelay],
    queryFn: async () => {
      // Try active relay and purplepag.es for profiles
      const relaysToTry = [activeRelay, 'wss://purplepag.es'];
      const profiles = await fetchProfiles([selectedBlog!.pubkey], relaysToTry);
      return profiles.get(selectedBlog!.pubkey) || null;
    },
    enabled: !!selectedBlog && !hasEmbeddedAuthor,
    staleTime: 60000, // Cache profile for 1 minute
  });

  // Use embedded author info if available, otherwise use fetched profile
  const authorProfile = hasEmbeddedAuthor
    ? { name: selectedBlog?.authorName, picture: selectedBlog?.authorPicture }
    : fetchedAuthorProfile;

  // Handle highlight deletion - update cache optimistically
  const handleHighlightDeleted = useCallback((highlightId: string) => {
    // Update the article's highlights cache
    if (highlightsQueryKey) {
      queryClient.setQueryData<Highlight[]>(highlightsQueryKey, (old) =>
        old ? old.filter((h) => h.id !== highlightId) : []
      );
    }
    // Invalidate user highlights so the panel refreshes
    queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
  }, [queryClient, highlightsQueryKey]);

  // Handle highlight creation - update cache optimistically
  const handleHighlightCreated = useCallback((highlight: Highlight) => {
    // Update the article's highlights cache
    if (highlightsQueryKey) {
      queryClient.setQueryData<Highlight[]>(highlightsQueryKey, (old) =>
        old ? [...old, highlight] : [highlight]
      );
    }
    // Invalidate user highlights so the panel refreshes
    queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
  }, [queryClient, highlightsQueryKey]);

  // Handle URL-based navigation
  useEffect(() => {
    if (!isHydrated) return;

    if (urlBlogId) {
      // Viewing a blog
      const naddrData = decodeNaddr(urlBlogId);
      if (naddrData) {
        // Check if we already have this blog loaded
        if (selectedBlogRef.current?.pubkey === naddrData.pubkey && selectedBlogRef.current?.dTag === naddrData.identifier) {
          return;
        }

        // Load blog from relay (direct URL visit)
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
            router.replace(`/draft/${newId}`);
          }
        });
      } else {
        // Invalid naddr, redirect to new draft
        const newId = createDraft();
        router.replace(`/draft/${newId}`);
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
        router.replace(`/draft/${newId}`);
      }
    } else {
      // No draft or blog in URL - create new draft
      const newId = createDraft();
      router.replace(`/draft/${newId}`);
    }
  }, [isHydrated, urlDraftId, urlBlogId, getDraft, createDraft, router, relays, activeRelay]);

  const handleSelectBlog = useCallback((blog: Blog) => {
    // Check for unsaved edits before navigating
    checkBlogForEditsRef.current();

    // Set the blog directly since we already have the data
    setSelectedBlog(blog);
    selectedBlogRef.current = blog; // Also set ref synchronously for useEffect
    setCurrentDraftId(null);
    setIsLoadingBlog(false);

    // Update URL for bookmarking without triggering navigation
    // (router.push would cause re-render and potentially re-fetch)
    const naddr = blogToNaddr(blog, relays);
    window.history.pushState(null, '', `/${naddr}`);
    if (isMobile) setActivePanel(null);
  }, [relays, isMobile]);

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
      router.replace(`/draft/${newId}`);
    }
  }, [justPublished, currentDraftId, deleteDraft, createDraft, router]);

  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleNewArticle = useCallback(() => {
    checkBlogForEditsRef.current();
    const newId = createDraft();
    // Update state directly and URL without triggering navigation
    setSelectedBlog(null);
    setCurrentDraftId(newId);
    window.history.pushState(null, '', `/draft/${newId}`);
    if (isMobile) setActivePanel(null);
  }, [createDraft, isMobile]);

  const handleSelectDraft = useCallback((draftId: string) => {
    checkBlogForEditsRef.current();
    // Update state directly and URL without triggering navigation
    setSelectedBlog(null);
    setCurrentDraftId(draftId);
    window.history.pushState(null, '', `/draft/${draftId}`);
    if (isMobile) setActivePanel(null);
  }, [isMobile]);

  const handleSelectHighlight = useCallback(async (highlight: Highlight) => {
    // Load the source article directly instead of navigating
    if (highlight.source) {
      checkBlogForEditsRef.current();

      // Try to find the blog in the query cache first
      const cachedQueries = queryClient.getQueriesData<{ blogs: Blog[] }>({ queryKey: ['blogs'] });
      let cachedBlog: Blog | undefined;
      for (const [, data] of cachedQueries) {
        if (data?.blogs) {
          cachedBlog = data.blogs.find(
            (b) => b.pubkey === highlight.source!.pubkey && b.dTag === highlight.source!.identifier
          );
          if (cachedBlog) break;
        }
      }

      if (cachedBlog) {
        // Use cached blog directly - no loading needed
        setSelectedBlog(cachedBlog);
        selectedBlogRef.current = cachedBlog;
        setCurrentDraftId(null);
        const naddr = blogToNaddr(cachedBlog, relays);
        window.history.pushState(null, '', `/${naddr}`);
      } else {
        // Fetch the blog if not in cache
        setIsLoadingBlog(true);
        setSelectedBlog(null);
        setCurrentDraftId(null);

        const blog = await fetchBlogByAddress({
          pubkey: highlight.source.pubkey,
          identifier: highlight.source.identifier,
          relay: activeRelay,
        });

        setIsLoadingBlog(false);

        if (blog) {
          setSelectedBlog(blog);
          selectedBlogRef.current = blog;
          const naddr = blogToNaddr(blog, relays);
          window.history.pushState(null, '', `/${naddr}`);
        }
      }

      if (isMobile) setActivePanel(null);
    }
  }, [relays, isMobile, activeRelay, queryClient]);

  const isLoggedIn = sessionStatus === 'authenticated' && !!pubkey;

  // Determine if we're editing an existing blog (only when we have a draft with actual edits)
  const isEditing = !!draft?.linkedBlog;

  // Determine editor content and key
  // Use consistent key format based on blog identity (pubkey:dTag) to prevent remount when transitioning from blog to draft
  const blogIdentityKey = selectedBlog ? `${selectedBlog.pubkey}:${selectedBlog.dTag}` : null;
  const linkedBlogKey = draft?.linkedBlog ? `${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}` : null;
  const editorKey = blogIdentityKey || linkedBlogKey || currentDraftId || 'new';

  // Store initial content in a ref to prevent re-renders from changing it
  // Only update when the editor key changes (switching to a different blog/draft)
  const initialContentRef = useRef<{ key: string; content: string }>({ key: '', content: '' });
  if (initialContentRef.current.key !== editorKey) {
    // Get content directly from the store (draft object is optimized and doesn't include content)
    const draftContent = currentDraftId ? useDraftStore.getState().drafts[currentDraftId]?.content : '';
    initialContentRef.current = {
      key: editorKey,
      content: selectedBlog ? selectedBlog.content : (draftContent ?? ''),
    };
  }
  const editorContent = initialContentRef.current.content;

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
        router.replace(`/draft/${draftId}`);
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
      router.replace(`/draft/${draftId}`);
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
      <div className={activePanel === 'following' ? '' : 'hidden'}>
        <FollowingFeedPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'blogs' ? '' : 'hidden'}>
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'drafts' ? '' : 'hidden'}>
        <DraftsPanel onSelectDraft={handleSelectDraft} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'highlights' ? '' : 'hidden'}>
        <HighlightsPanel onSelectHighlight={handleSelectHighlight} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'stacks' ? '' : 'hidden'}>
        <StacksPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      {activePanel === 'relays' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}
      {activePanel === 'profile' && pubkey && (
        <ProfilePanel onClose={handleClosePanel} pubkey={pubkey} />
      )}

      <SidebarInset
        className={`bg-background transition-[margin] duration-200 ease-linear ${activePanel ? 'sm:ml-72' : ''}`}
      >
        <header className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between px-2 lg:px-3 py-2 border-b border-border bg-background gap-2">
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <SidebarTrigger className="lg:hidden" />
            {isLoggedIn && currentDraftId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showFloatingToolbar ? 'secondary' : 'ghost'}
                    onClick={() => setShowFloatingToolbar(!showFloatingToolbar)}
                  >
                    <PencilRulerIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showFloatingToolbar ? 'Hide Toolbar' : 'Show Toolbar'}</TooltipContent>
              </Tooltip>
            )}
            {!selectedBlog && !isLoadingBlog && <SaveStatusIndicator className="hidden lg:flex" />}
            {selectedBlog && (
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                {isLoadingAuthor && !hasEmbeddedAuthor ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </>
                ) : (
                  <AuthorDropdown
                    authorPubkey={selectedBlog.pubkey}
                    authorName={authorProfile?.name}
                    authorPicture={authorProfile?.picture}
                  />
                )}
              </div>
            )}
            {isLoadingBlog && (
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </div>
            )}
          </div>
          {selectedBlog ? (
            <div className="flex-1 min-w-0 flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1 className="text-sm font-medium text-foreground/80 truncate max-w-md cursor-default">
                    {selectedBlog.title || 'Untitled'}
                  </h1>
                </TooltipTrigger>
                <TooltipContent>{selectedBlog.title || 'Untitled'}</TooltipContent>
              </Tooltip>
            </div>
          ) : isLoadingBlog ? (
            <div className="flex-1 min-w-0 flex justify-center">
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <div className="flex-1 min-w-0" />
          )}
          <div className="flex items-center gap-1 lg:gap-2 justify-end flex-shrink-0">
            {isLoggedIn && selectedBlog && (
              <ZapButton blog={selectedBlog} />
            )}
            {isLoggedIn && selectedBlog && (
              <StackButton blog={selectedBlog} />
            )}
            {isLoggedIn && isLoadingBlog && (
              <>
                <Button size="sm" variant="ghost" disabled className="opacity-50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10h7l-9 13v-9H4l9-13z" />
                  </svg>
                </Button>
                <Button size="sm" variant="ghost" disabled className="opacity-50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </Button>
                <Button size="sm" variant="secondary" disabled className="opacity-50">
                  Edit
                </Button>
              </>
            )}
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
                  // Update state directly and URL without triggering navigation
                  setSelectedBlog(null);
                  setCurrentDraftId(draftId);
                  window.history.replaceState(null, '', `/draft/${draftId}`);
                  // Switch to drafts panel if a panel is open
                  if (activePanel) {
                    setActivePanel('drafts');
                  }
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
        <div className="relative flex-1 overflow-y-auto overscroll-auto cursor-text" data-editor-scroll-container>
          {isLoadingBlog ? (
            <div className="min-h-full w-full flex flex-col">
              <div className="w-full py-8 editor-root">
                {/* Title skeleton */}
                <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-8" />
                {/* Content skeletons */}
                <div className="space-y-4">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
          <div className="min-h-full w-full flex flex-col">
            <NostrEditor
              ref={editorRef}
              key={editorKey}
              placeholder="What's on your mind?"
              initialMarkdown={editorContent}
              onChange={handleEditorChange}
              onProfileLookup={lookupProfile}
              onNoteLookup={lookupNote}
              toolbarContainer={selectedBlog ? null : floatingToolbarElement}
              readOnly={!!selectedBlog}
              highlightSource={selectedBlog ? {
                kind: 30023,
                pubkey: selectedBlog.pubkey,
                identifier: selectedBlog.dTag,
                relay: activeRelay,
              } : undefined}
              highlights={highlights}
              onHighlightDeleted={handleHighlightDeleted}
              onHighlightCreated={handleHighlightCreated}
            />
            {selectedBlog && (
              <div className="px-4 sm:px-8 md:px-16 lg:px-24 pb-8 max-w-3xl mx-auto w-full">
                <CommentsSection
                  article={{
                    pubkey: selectedBlog.pubkey,
                    identifier: selectedBlog.dTag,
                    eventId: selectedBlog.id,
                  }}
                />
              </div>
            )}
          </div>
          )}
        </div>

        {/* Floating Toolbar */}
        {!selectedBlog && !isLoadingBlog && (
          <div
            className={`absolute bottom-4 left-0 right-0 z-40 transition-all duration-200 ease-out ${
              showFloatingToolbar ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="editor-root flex justify-center">
              <div ref={floatingToolbarRef} />
            </div>
          </div>
        )}
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
