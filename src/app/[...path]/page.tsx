"use client";

import {
  Suspense,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  NostrEditor,
  type NostrEditorHandle,
  type Highlight,
} from "@/components/editor";
import MarkdownEditor, {
  type MarkdownEditorHandle,
} from "@/components/editor/MarkdownEditor";
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import ContentHeader from "@/components/layout/ContentHeader";
import AppSidebar from "@/components/sidebar/AppSidebar";
import StackMenuSub from "@/components/stacks/StackMenuSub";
import ZapButton from "@/components/zap/ZapButton";
import LoginButton from "@/components/auth/LoginButton";
import ThemeToggleButton from "@/components/theme/ThemeToggleButton";
import PublishDialog from "@/components/publish/PublishDialog";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import type { UserWithKeys } from "@/types/auth";
import { useDraftStore } from "@/lib/stores/draftStore";
import { useDraftAutoSave } from "@/lib/hooks/useDraftAutoSave";
import { lookupProfile } from "@/lib/nostr/profiles";
import { useProfile } from "@/lib/hooks/useProfiles";
import { lookupNote } from "@/lib/nostr/notes";
import { fetchBlogByAddress, fetchHighlights, fetchUserLikedEvent } from "@/lib/nostr/fetch";
import { blogToNaddr, decodeNaddr } from "@/lib/nostr/naddr";
import { broadcastEvent, publishReaction } from "@/lib/nostr/publish";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import type { Blog } from "@/lib/nostr/types";
import { CommentsSection } from "@/components/comments";
import AuthorDropdown from "@/components/author/AuthorDropdown";
import EventJsonDialog from "@/components/ui/EventJsonDialog";
import { downloadMarkdownFile } from "@/lib/utils/download";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CodeIcon,
  DownloadIcon,
  HeartIcon,
  MoreHorizontalIcon,
  PenLineIcon,
  PencilRulerIcon,
  SendIcon,
} from "lucide-react";
import { publishDrafts } from "@/lib/nostr/draftSync";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
    >
      <path d="M475 64H37C16.58 64 0 81.38 0 102.77v306.42C0 430.59 16.58 448 37 448h438c20.38 0 37-17.41 37-38.81V102.77C512 81.38 495.42 64 475 64M288 368h-64V256l-48 64l-48-64v112H64V144h64l48 80l48-80h64Zm96 0l-80-112h48.05L352 144h64v112h48Z" />
    </svg>
  );
}

interface FloatingToolbarProps {
  show: boolean;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
}

function FloatingToolbar({
  show,
  toolbarRef,
}: FloatingToolbarProps) {
  const { state: sidebarState, isMobile } = useSidebar();
  const marginLeft =
    !isMobile && sidebarState === "expanded" ? "16rem" : "0";

  return (
    <div
      className={`fixed bottom-4 left-0 right-0 z-40 transition-all duration-200 ease-out ${
        show
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ marginLeft }}
    >
      <div className="editor-root flex justify-center">
        <div ref={toolbarRef} />
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [broadcastingBlogId, setBroadcastingBlogId] = useState<string | null>(
    null,
  );
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const [isArticleRevealReady, setIsArticleRevealReady] = useState(true);
  const [isPublishingLike, setIsPublishingLike] = useState(false);
  const [hasLikedSelectedBlog, setHasLikedSelectedBlog] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const handleProfileLookup = useCallback(
    (npub: string) => lookupProfile(npub),
    [],
  );
  const handleNoteLookup = useCallback(
    (nevent: string) => lookupNote(nevent, activeRelay),
    [activeRelay],
  );
  const editorRef = useRef<NostrEditorHandle>(null);
  const markdownEditorRef = useRef<MarkdownEditorHandle>(null);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(true);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const floatingToolbarRef = useRef<HTMLDivElement>(null);
  const [floatingToolbarElement, setFloatingToolbarElement] =
    useState<HTMLDivElement | null>(null);
  const hasUserTyped = useRef(false);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectedBlogRef = useRef<Blog | null>(null); // Track current blog for useEffect without triggering re-runs

  // Connect floating toolbar ref to state when visible (before paint to avoid flash)
  useLayoutEffect(() => {
    if (
      showFloatingToolbar &&
      !selectedBlog &&
      !isLoadingBlog &&
      !isMarkdownMode
    ) {
      setFloatingToolbarElement(floatingToolbarRef.current);
    } else {
      setFloatingToolbarElement(null);
    }
  }, [showFloatingToolbar, selectedBlog, isLoadingBlog, isMarkdownMode]);
  const queryClient = useQueryClient();

  // Parse path params to get draft or blog ID
  const pathSegments = params.path as string[] | undefined;
  const scrollToHighlightId = searchParams.get("highlight");
  let urlDraftId: string | null = null;
  let urlBlogId: string | null = null;
  const isDraftRoute = pathSegments?.[0] === "draft";

  if (pathSegments && pathSegments.length > 0) {
    if (pathSegments[0] === "draft" && pathSegments[1]) {
      urlDraftId = pathSegments[1];
    } else if (pathSegments[0]?.startsWith("naddr1")) {
      urlBlogId = pathSegments[0];
    }
  }

  const createDraft = useDraftStore((state) => state.createDraft);
  const createDraftFromBlog = useDraftStore(
    (state) => state.createDraftFromBlog,
  );
  const getDraft = useDraftStore((state) => state.getDraft);
  const deleteDraft = useDraftStore((state) => state.deleteDraft);
  const findDraftByLinkedBlog = useDraftStore(
    (state) => state.findDraftByLinkedBlog,
  );
  const createDraftIfAllowed = useCallback(() => {
    if (sessionStatus !== "authenticated" || !pubkey) {
      router.push("/login");
      return null;
    }
    return createDraft();
  }, [sessionStatus, pubkey, router, createDraft]);

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

  useEffect(() => {
    setIsPublishingLike(false);
    setHasLikedSelectedBlog(false);
  }, [selectedBlog?.id]);

  useEffect(() => {
    const shouldDelayReveal =
      !!selectedBlog && !isLoadingBlog && !!scrollToHighlightId;

    if (!shouldDelayReveal) {
      setIsArticleRevealReady(true);
      return;
    }

    setIsArticleRevealReady(false);

    // Fallback to avoid indefinite hidden content if target highlight can't be matched.
    const timeoutId = window.setTimeout(() => {
      setIsArticleRevealReady(true);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedBlog, isLoadingBlog, scrollToHighlightId]);

  const showArticlePrescrollSkeleton =
    !!selectedBlog && !!scrollToHighlightId && !isArticleRevealReady;

  // Fetch highlights when viewing a blog using React Query
  // Only fetch the logged-in user's highlights
  const highlightsQueryKey =
    selectedBlog && pubkey
      ? [
          "highlights",
          selectedBlog.pubkey,
          selectedBlog.dTag,
          activeRelay,
          pubkey,
        ]
      : null;

  const { data: highlights = [] } = useQuery({
    queryKey: highlightsQueryKey!,
    queryFn: () =>
      fetchHighlights({
        articlePubkey: selectedBlog!.pubkey,
        articleIdentifier: selectedBlog!.dTag,
        relay: activeRelay,
        authors: [pubkey!],
      }),
    enabled: !!selectedBlog && !!pubkey,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const selectedBlogId = selectedBlog?.id ?? null;
  const likeQueryKey = useMemo(
    () =>
      selectedBlogId && pubkey && activeRelay
        ? ["article-liked", selectedBlogId, pubkey, activeRelay]
        : null,
    [selectedBlogId, pubkey, activeRelay],
  );

  const { data: hasExistingLike = false } = useQuery({
    queryKey: likeQueryKey!,
    queryFn: () =>
      fetchUserLikedEvent({
        eventId: selectedBlog!.id,
        pubkey: pubkey!,
        relay: activeRelay,
      }),
    enabled: !!likeQueryKey,
    staleTime: 30000,
  });

  // Fetch author profile when viewing a blog (only if not already embedded)
  // Uses shared cache populated by ExploreFeed/FollowingFeedView batch fetches
  const hasEmbeddedAuthor = !!(
    selectedBlog?.authorName || selectedBlog?.authorPicture
  );
  const { data: fetchedAuthorProfile } = useProfile(
    selectedBlog && !hasEmbeddedAuthor ? selectedBlog.pubkey : null,
  );

  // Use embedded author info if available, otherwise use fetched profile
  const authorProfile = hasEmbeddedAuthor
    ? { name: selectedBlog?.authorName, picture: selectedBlog?.authorPicture }
    : fetchedAuthorProfile;

  // Handle highlight deletion - update cache optimistically
  const handleHighlightDeleted = useCallback(
    (highlightId: string) => {
      // Update the article's highlights cache
      if (highlightsQueryKey) {
        queryClient.setQueryData<Highlight[]>(highlightsQueryKey, (old) =>
          old ? old.filter((h) => h.id !== highlightId) : [],
        );
      }
      // Invalidate user highlights so the highlights view refreshes
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    [queryClient, highlightsQueryKey],
  );

  // Handle highlight creation - update cache optimistically
  const handleHighlightCreated = useCallback(
    (highlight: Highlight) => {
      // Update the article's highlights cache
      if (highlightsQueryKey) {
        queryClient.setQueryData<Highlight[]>(highlightsQueryKey, (old) =>
          old ? [...old, highlight] : [highlight],
        );
      }
      // Invalidate user highlights so the highlights view refreshes
      queryClient.invalidateQueries({ queryKey: ["user-highlights"] });
    },
    [queryClient, highlightsQueryKey],
  );

  // Handle URL-based navigation
  useEffect(() => {
    if (!isHydrated) return;

    if (urlBlogId) {
      // Viewing a blog
      const naddrData = decodeNaddr(urlBlogId);
      if (naddrData) {
        // Check if we already have this blog loaded
        if (
          selectedBlogRef.current?.pubkey === naddrData.pubkey &&
          selectedBlogRef.current?.dTag === naddrData.identifier
        ) {
          return;
        }

        // Load blog from relay (direct URL visit)
        setSelectedBlog(null);
        setCurrentDraftId(null);
        setIsLoadingBlog(true);

        fetchBlogByAddress({
          pubkey: naddrData.pubkey,
          identifier: naddrData.identifier,
          relay: activeRelay,
        }).then((blog) => {
          setIsLoadingBlog(false);
          if (blog) {
            setSelectedBlog(blog);
          } else {
            // Blog not found on active relay, redirect to new draft
            const newId = createDraftIfAllowed();
            if (!newId) return;
            router.replace(`/draft/${newId}`);
          }
        });
      } else {
        // Invalid naddr, redirect to new draft
        const newId = createDraftIfAllowed();
        if (!newId) return;
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
        const newId = createDraftIfAllowed();
        if (!newId) return;
        router.replace(`/draft/${newId}`);
      }
    } else {
      // No draft or blog in URL - create new draft
      const newId = createDraftIfAllowed();
      if (!newId) return;
      router.replace(`/draft/${newId}`);
    }
  }, [
    isHydrated,
    urlDraftId,
    urlBlogId,
    getDraft,
    createDraftIfAllowed,
    router,
    activeRelay,
  ]);

  const getEditorContent = useCallback(() => {
    if (isMarkdownMode) {
      return markdownEditorRef.current?.getMarkdown() ?? "";
    }
    return editorRef.current?.getMarkdown() ?? "";
  }, [isMarkdownMode]);

  const [justPublished, setJustPublished] = useState(false);
  const [publishNavigateNaddr, setPublishNavigateNaddr] = useState<
    string | null
  >(null);

  const handlePublishSuccess = useCallback(
    (info?: { pubkey: string; dTag: string }) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setJustPublished(true);
      if (info) {
        setPublishNavigateNaddr(
          blogToNaddr({ pubkey: info.pubkey, dTag: info.dTag }, relays),
        );
      }
    },
    [queryClient, relays],
  );

  const handlePublishDialogClose = useCallback(() => {
    setShowPublishDialog(false);

    // Clean up after successful publish when dialog closes
    if (justPublished) {
      setJustPublished(false);
      if (publishNavigateNaddr) {
        setPublishNavigateNaddr(null);
        if (currentDraftId && draft?.linkedBlog) {
          deleteDraft(currentDraftId);
        }
        setSelectedBlog(null);
        setCurrentDraftId(null);
        router.replace(`/${publishNavigateNaddr}`);
        return;
      }
      if (currentDraftId) {
        deleteDraft(currentDraftId);
      }
      setSelectedBlog(null);
      const newId = createDraftIfAllowed();
      if (!newId) return;
      router.replace(`/draft/${newId}`);
    }
  }, [
    justPublished,
    publishNavigateNaddr,
    currentDraftId,
    deleteDraft,
    createDraftIfAllowed,
    router,
    draft?.linkedBlog,
  ]);

  const handlePublishDraft = useCallback(async () => {
    if (sessionStatus !== "authenticated" || !pubkey || !currentDraftId) {
      router.push("/login");
      return;
    }
    const draftToPublish = useDraftStore.getState().drafts[currentDraftId];
    if (!draftToPublish) return;

    try {
      const result = await publishDrafts({
        drafts: [draftToPublish],
        pubkey,
        relays,
        secretKey: user?.secretKey,
        onDraftPublished: (draftId, eventId) => {
          const draft = useDraftStore.getState().drafts[draftId];
          if (!draft) return;
          useDraftStore
            .getState()
            .upsertDraftFromSync({ ...draft, remoteEventId: eventId });
        },
      });
      if (result.published > 0) {
        toast.success("Draft published");
      } else {
        toast.error("Draft publish failed");
      }
    } catch (error) {
      toast.error("Draft publish failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [currentDraftId, pubkey, relays, router, sessionStatus, user?.secretKey]);

  const isLoggedIn = sessionStatus === "authenticated" && !!pubkey;
  const canEditSelectedBlog =
    isLoggedIn &&
    !!selectedBlog &&
    !!pubkey &&
    selectedBlog.pubkey === pubkey;

  // Determine if we're editing an existing blog (only when we have a draft with actual edits)
  const isEditing = !!draft?.linkedBlog;

  // Determine editor content and key
  // Prefix with view mode to differentiate blog view from draft view of same article
  const blogIdentityKey = selectedBlog
    ? `${selectedBlog.pubkey}:${selectedBlog.dTag}`
    : null;
  const linkedBlogKey = draft?.linkedBlog
    ? `${draft.linkedBlog.pubkey}:${draft.linkedBlog.dTag}`
    : null;
  const editorKey = blogIdentityKey
    ? `blog:${blogIdentityKey}`
    : linkedBlogKey
      ? `draft:${linkedBlogKey}`
      : currentDraftId || "new";

  // Store initial content in a ref to prevent re-renders from changing it
  // Only update when switching to a different blog/draft.
  const editorContentKey = editorKey;
  const initialContentRef = useRef<{ key: string; content: string }>({
    key: "",
    content: "",
  });
  if (initialContentRef.current.key !== editorContentKey) {
    // Get content directly from the store (draft object is optimized and doesn't include content)
    const draftContent = currentDraftId
      ? useDraftStore.getState().drafts[currentDraftId]?.content
      : "";
    initialContentRef.current = {
      key: editorContentKey,
      content: selectedBlog ? selectedBlog.content : (draftContent ?? ""),
    };
  }
  const editorContent = initialContentRef.current.content;

  const getContentForModeSwitch = useCallback(() => {
    const activeEditorRef = isMarkdownMode
      ? markdownEditorRef.current
      : editorRef.current;

    // If current editor is mounted, trust its content (including intentional empty content).
    if (activeEditorRef) {
      return activeEditorRef.getMarkdown();
    }

    // During quick route transitions (e.g. click Edit then toggle), editor may not be mounted yet.
    // Fall back to the draft snapshot instead of writing an empty string.
    if (currentDraftId) {
      return useDraftStore.getState().drafts[currentDraftId]?.content ?? "";
    }

    return initialContentRef.current.content;
  }, [isMarkdownMode, currentDraftId]);

  const handleToggleMarkdownMode = useCallback(() => {
    const contentForNextMode = getContentForModeSwitch();

    initialContentRef.current = {
      key: editorKey,
      content: contentForNextMode,
    };

    if (currentDraftId) {
      useDraftStore.getState().setDraftContent(currentDraftId, contentForNextMode);
    }

    setIsMarkdownMode((prev) => !prev);
  }, [getContentForModeSwitch, editorKey, currentDraftId]);

  // Reset state when switching to a different article
  useEffect(() => {
    hasUserTyped.current = false;
  }, [editorKey]);

  // Extract first H1 heading from markdown content
  const getFirstH1 = (content: string): string | null => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : null;
  };

  const hasImageInContent = (content: string, imageUrl?: string): boolean => {
    if (!imageUrl) return false;
    const escaped = imageUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const imageRegex = new RegExp(escaped, "i");
    return imageRegex.test(content);
  };

  // Check if we should show the title above the editor
  const shouldShowTitle =
    selectedBlog?.title &&
    getFirstH1(selectedBlog.content)?.toLowerCase() !==
      selectedBlog.title.toLowerCase();
  const shouldInsertImage =
    selectedBlog?.image &&
    !hasImageInContent(selectedBlog.content, selectedBlog.image);

  const editorMarkdown = useMemo(() => {
    if (!selectedBlog) return editorContent;
    let nextContent = editorContent;
    if (shouldShowTitle) {
      nextContent = `# ${selectedBlog.title}\n\n${nextContent}`;
    }
    if (shouldInsertImage) {
      const imageBlock = `![Cover image](${selectedBlog.image})\n\n`;
      if (shouldShowTitle) {
        nextContent = nextContent.replace(
          /^# .+\n\n/,
          (match) => `${imageBlock}${match}`,
        );
      } else {
        nextContent = `${imageBlock}${nextContent}`;
      }
    }
    return nextContent;
  }, [editorContent, selectedBlog, shouldShowTitle, shouldInsertImage]);

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
        const markdown = isMarkdownMode
          ? (markdownEditorRef.current?.getMarkdown() ?? "")
          : (editorRef.current?.getMarkdown() ?? "");
        handleContentChange(markdown);
      }, 300);
    }
  }, [selectedBlog, currentDraftId, handleContentChange, isMarkdownMode]);

  const handleBroadcast = async (blog: Blog) => {
    if (broadcastingBlogId || !blog.rawEvent) return;

    setBroadcastingBlogId(blog.id);
    try {
      const results = await broadcastEvent(blog.rawEvent, relays);
      const successfulRelays = results.filter((r) => r.success);
      const successCount = successfulRelays.length;

      if (successCount > 0) {
        const relayList = successfulRelays.map((r) => r.relay).join("\n");
        toast.success("Article broadcast!", {
          description: `Sent to ${successCount} relay${successCount !== 1 ? "s" : ""}:\n${relayList}`,
          duration: 5000,
        });
      } else {
        toast.error("Broadcast failed", {
          description: "Failed to broadcast to any relay",
        });
      }
    } catch (err) {
      console.error("Failed to broadcast article:", err);
      toast.error("Broadcast failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setBroadcastingBlogId(null);
    }
  };

  const handleViewJson = (event: unknown | undefined) => {
    if (!event) return;
    setJsonEvent(event);
    setIsJsonOpen(true);
  };

  const handleLike = useCallback(async () => {
    if (!selectedBlog || isPublishingLike) return;

    if (sessionStatus !== "authenticated" || !pubkey) {
      router.push("/login");
      return;
    }

    setIsPublishingLike(true);
    try {
      const results = await publishReaction({
        target: {
          eventId: selectedBlog.id,
          pubkey: selectedBlog.pubkey,
          kind: 30023,
          address: `30023:${selectedBlog.pubkey}:${selectedBlog.dTag}`,
          relayHint: activeRelay,
        },
        relays,
        secretKey: user?.secretKey,
      });
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        setHasLikedSelectedBlog(true);
        if (likeQueryKey) {
          queryClient.setQueryData<boolean>(likeQueryKey, true);
        }
        queryClient.invalidateQueries({ queryKey: ["blogs"] });
        toast.success("Article liked");
      } else {
        toast.error("Like failed", {
          description: "Failed to publish to any relay",
        });
      }
    } catch (error) {
      toast.error("Like failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsPublishingLike(false);
    }
  }, [
    activeRelay,
    isPublishingLike,
    pubkey,
    queryClient,
    likeQueryKey,
    relays,
    router,
    selectedBlog,
    sessionStatus,
    user?.secretKey,
  ]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-svh w-full flex-col bg-background">
        <ContentHeader
          sticky
          brandClassName={isDraftRoute ? "hidden sm:inline-flex" : undefined}
          left={
            <>
              {!selectedBlog && !isLoadingBlog && (
                <SaveStatusIndicator className="hidden lg:flex" />
              )}
            </>
          }
          right={
            <>
              {isLoggedIn && currentDraftId && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={
                          showFloatingToolbar && !isMarkdownMode
                            ? "secondary"
                            : "ghost"
                        }
                        onClick={() =>
                          !isMarkdownMode &&
                          setShowFloatingToolbar(!showFloatingToolbar)
                        }
                        disabled={isMarkdownMode}
                      >
                        <PencilRulerIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMarkdownMode
                        ? "Toolbar unavailable in markdown mode"
                        : showFloatingToolbar
                          ? "Hide Toolbar"
                          : "Show Toolbar"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant={isMarkdownMode ? "secondary" : "ghost"}
                        onClick={handleToggleMarkdownMode}
                      >
                        <MarkdownIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMarkdownMode ? "Rich Text Mode" : "Markdown Mode"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              {isLoggedIn && currentDraftId && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handlePublishDraft}
                >
                  Publish Draft
                </Button>
              )}
              {isLoggedIn && currentDraftId && (
                <Button
                  size="sm"
                  variant={isEditing ? "success" : "default"}
                  onClick={() => setShowPublishDialog(true)}
                >
                  {isEditing ? "Publish Edit" : "Publish"}
                </Button>
              )}
              {!isDraftRoute && (
                <Link
                  href="/draft/new"
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <PenLineIcon className="w-4 h-4" />
                  <span>Write</span>
                </Link>
              )}
              <ThemeToggleButton />
              <LoginButton />
            </>
          }
        />
        <div className="flex min-h-0 flex-1 w-full">
          <AppSidebar />
          <SidebarInset className="bg-background">
            <>
          {(selectedBlog || isLoadingBlog) && (
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-8">
              <div className="editor-root min-h-12 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0 overflow-hidden flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.history.length > 1) {
                        router.back();
                        return;
                      }
                      router.push("/");
                    }}
                    aria-label="Back"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Button>
                  {isLoadingBlog ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                  ) : (
                    selectedBlog && (
                      <AuthorDropdown
                        authorPubkey={selectedBlog.pubkey}
                        authorName={authorProfile?.name}
                        authorPicture={authorProfile?.picture}
                      />
                    )
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isLoggedIn && selectedBlog && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleLike}
                      disabled={isPublishingLike}
                      title="Like this article"
                      aria-label="Like this article"
                    >
                      <HeartIcon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          hasLikedSelectedBlog || hasExistingLike
                            ? "text-red-500 fill-red-500"
                            : "text-muted-foreground",
                        )}
                      />
                    </Button>
                  )}
                  {isLoggedIn && selectedBlog && <ZapButton blog={selectedBlog} />}
                  {selectedBlog && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="More options"
                        >
                          <MoreHorizontalIcon className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <StackMenuSub blog={selectedBlog} />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            downloadMarkdownFile(
                              selectedBlog.title,
                              selectedBlog.content || "",
                            )
                          }
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBroadcast(selectedBlog)}
                          disabled={
                            broadcastingBlogId === selectedBlog.id ||
                            !selectedBlog.rawEvent
                          }
                        >
                          <SendIcon className="w-4 h-4" />
                          {broadcastingBlogId === selectedBlog.id
                            ? "Broadcasting..."
                            : "Broadcast"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewJson(selectedBlog.rawEvent)}
                          disabled={!selectedBlog.rawEvent}
                        >
                          <CodeIcon className="w-4 h-4" />
                          View raw JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {canEditSelectedBlog && !currentDraftId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // Check if a draft already exists for this blog
                        const existingDraft = findDraftByLinkedBlog(
                          selectedBlog.pubkey,
                          selectedBlog.dTag,
                        );
                        const draftId =
                          existingDraft?.id ??
                          createDraftFromBlog(
                            editorRef.current?.getMarkdown() ??
                              selectedBlog.content,
                            {
                              pubkey: selectedBlog.pubkey,
                              dTag: selectedBlog.dTag,
                              title: selectedBlog.title,
                              summary: selectedBlog.summary,
                              image: selectedBlog.image,
                              tags: selectedBlog.tags,
                            },
                          );
                        // Update state directly and URL without triggering navigation
                        setSelectedBlog(null);
                        setCurrentDraftId(draftId);
                        router.replace(`/draft/${draftId}`, { scroll: false });
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {isLoggedIn && isLoadingBlog && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="opacity-50"
                      >
                        <HeartIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="opacity-50"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M13 10h7l-9 13v-9H4l9-13z" />
                        </svg>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="opacity-50"
                      >
                        <MoreHorizontalIcon className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <div
            className="relative flex-1 overflow-y-auto overscroll-auto cursor-text"
            data-editor-scroll-container
          >
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
              <div className="relative min-h-full w-full">
                {showArticlePrescrollSkeleton && (
                  <div className="absolute inset-x-0 top-0 z-10 bg-background">
                    <div className="w-full py-8 editor-root">
                      <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-8" />
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
                )}
                <div
                  className={cn(
                    "min-h-full w-full flex flex-col",
                    showArticlePrescrollSkeleton && "opacity-0 pointer-events-none",
                  )}
                >
                  {isMarkdownMode && !selectedBlog ? (
                    <MarkdownEditor
                      ref={markdownEditorRef}
                      key={`${editorKey}-markdown`}
                      initialContent={editorContent}
                      onChange={handleEditorChange}
                      placeholder="Write in markdown..."
                      autoFocus={!!currentDraftId}
                    />
                  ) : (
                    <NostrEditor
                      ref={editorRef}
                      key={editorKey}
                      placeholder=""
                      autoFocus={!selectedBlog && !!currentDraftId}
                      initialMarkdown={editorMarkdown}
                      onChange={handleEditorChange}
                      onProfileLookup={handleProfileLookup}
                      onNoteLookup={handleNoteLookup}
                      toolbarContainer={
                        selectedBlog ? null : floatingToolbarElement
                      }
                      readOnly={!!selectedBlog}
                      audioUrl={selectedBlog?.audioUrl}
                      audioMime={selectedBlog?.audioMime}
                      highlightSource={
                        selectedBlog
                          ? {
                              kind: 30023,
                              pubkey: selectedBlog.pubkey,
                              identifier: selectedBlog.dTag,
                              relay: activeRelay,
                            }
                          : undefined
                      }
                      highlights={highlights}
                      onHighlightDeleted={handleHighlightDeleted}
                      onHighlightCreated={handleHighlightCreated}
                      scrollToHighlightId={
                        selectedBlog ? scrollToHighlightId : null
                      }
                      onScrollToHighlightSettled={() =>
                        setIsArticleRevealReady(true)
                      }
                    />
                  )}
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
              </div>
            )}
          </div>

          {/* Floating Toolbar */}
          {!selectedBlog && !isLoadingBlog && (
            <FloatingToolbar
              show={showFloatingToolbar && !isMarkdownMode}
              toolbarRef={floatingToolbarRef}
            />
          )}
        </>
      </SidebarInset>
        </div>
      </div>

      <PublishDialog
        isOpen={showPublishDialog}
        onClose={handlePublishDialogClose}
        getContent={getEditorContent}
        linkedBlog={
          draft?.linkedBlog ||
          (selectedBlog
            ? {
                pubkey: selectedBlog.pubkey,
                dTag: selectedBlog.dTag,
                title: selectedBlog.title,
                summary: selectedBlog.summary,
                image: selectedBlog.image,
                tags: selectedBlog.tags,
              }
            : undefined)
        }
        onPublishSuccess={handlePublishSuccess}
      />
      <EventJsonDialog
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
        event={jsonEvent}
      />
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
