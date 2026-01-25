'use client';

import { useState, useEffect } from 'react';
import { XIcon, Trash2Icon, Loader2Icon, RefreshCwIcon, ArrowLeftIcon, MoreHorizontalIcon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { useQuery } from '@tanstack/react-query';
import { useStackStore } from '@/lib/stores/stackStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { fetchUserStacks, deleteStack, publishStack } from '@/lib/nostr/stacks';
import { fetchBlogByAddress } from '@/lib/nostr/fetch';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import type { Blog, Stack, StackItem } from '@/lib/nostr/types';
import { useSidebar } from '@/components/ui/sidebar';
import PanelRail from './PanelRail';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { extractFirstImage } from '@/lib/utils/markdown';
import { generateAvatar } from '@/lib/avatar';
import { downloadMarkdownFile } from '@/lib/utils/download';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncateNpub(pubkey: string): string {
  const npub = nip19.npubEncode(pubkey);
  return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
}

interface StacksPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
  selectedBlogId?: string;
}


interface StackItemDisplayProps {
  stack: Stack;
  item: StackItem;
  blog: Blog | null;
  onSelectBlog: (blog: Blog) => void;
  onDeleteItem: (stack: Stack, item: StackItem) => void;
  isDeleting: boolean;
  selectedBlogId?: string;
  getProfile: (pubkey: string) => { name?: string; picture?: string } | undefined;
  isLoadingProfiles: boolean;
  isFetchingProfiles: boolean;
}

function StackItemDisplay({
  stack,
  item,
  blog,
  onSelectBlog,
  onDeleteItem,
  isDeleting,
  selectedBlogId,
  getProfile,
  isLoadingProfiles,
  isFetchingProfiles,
}: StackItemDisplayProps) {
  if (!blog) {
    return (
      <div className="group relative p-2 text-sm text-muted-foreground italic">
        <div className="w-full text-left p-2 rounded-md bg-sidebar-accent/40">
          Article not found
        </div>
        <button
          onClick={() => onDeleteItem(stack, item)}
          disabled={isDeleting}
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400 disabled:opacity-50 transition-opacity"
          title="Remove from stack"
          aria-label="Remove from stack"
        >
          {isDeleting ? (
            <Loader2Icon className="w-3 h-3 animate-spin" />
          ) : (
            <XIcon className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  }

  const isSelected = blog.id === selectedBlogId;
  const thumbnail = blog.image || extractFirstImage(blog.content);
  const profile = getProfile(item.pubkey);
  const isProfileLoading = !profile && (isLoadingProfiles || isFetchingProfiles);
  const avatarUrl = profile?.picture || generateAvatar(item.pubkey);
  const displayName = profile?.name || truncateNpub(item.pubkey);

  return (
    <div className="group relative p-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelectBlog(blog)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectBlog(blog);
          }
        }}
        className={`w-full text-left p-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-2 min-w-0 overflow-hidden">
              {isProfileLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </>
              ) : (
                <>
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {displayName}
                  </span>
                </>
              )}
            </span>
          </div>
          <h3 className="text-sm font-medium text-foreground truncate">
            {blog.title || 'Untitled'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
            {blog.summary}
          </p>
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className="max-h-32 rounded object-contain mt-2"
            />
          )}
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground/70">
            <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-sidebar-accent/60 hover:ring-1 hover:ring-sidebar-ring/40 text-muted-foreground"
                  aria-label="More options"
                >
                  <MoreHorizontalIcon className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadMarkdownFile(blog.title, blog.content || '');
                  }}
                >
                  Download markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(stack, item);
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Removing...' : 'Remove from stack'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StackDisplayProps {
  stack: Stack;
  onSelectStack: (stack: Stack) => void;
  onDeleteStack: (stack: Stack) => void;
  isDeletingStack: boolean;
}

function StackDisplay({ stack, onSelectStack, onDeleteStack, isDeletingStack }: StackDisplayProps) {
  return (
    <div className="group relative">
      <button
        onClick={() => onSelectStack(stack)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {stack.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {stack.items.length} {stack.items.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteStack(stack);
        }}
        disabled={isDeletingStack}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400 disabled:opacity-50 transition-opacity"
        title="Delete stack"
        aria-label="Delete stack"
      >
        {isDeletingStack ? (
          <Loader2Icon className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2Icon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function StacksPanel({ onSelectBlog, onClose, selectedBlogId }: StacksPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingStackId, setDeletingStackId] = useState<string | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);

  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const secretKey = user?.secretKey;

  const {
    stacks,
    setStacks,
    removeStack,
    removeItemFromStack,
    addItemToStack,
    isLoading,
    setLoading,
  } = useStackStore();

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const { state: sidebarState, isMobile } = useSidebar();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch stacks on mount
  useEffect(() => {
    if (!isHydrated || !pubkey || !activeRelay) return;

    const loadStacks = async () => {
      setLoading(true);
      try {
        const fetchedStacks = await fetchUserStacks({
          pubkey,
          relay: activeRelay,
        });
        setStacks(fetchedStacks);
      } catch (err) {
        console.error('Failed to fetch stacks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStacks();
  }, [isHydrated, pubkey, activeRelay, setStacks, setLoading]);

  const handleRefresh = async () => {
    if (!pubkey || !activeRelay) return;

    setLoading(true);
    try {
      const fetchedStacks = await fetchUserStacks({
        pubkey,
        relay: activeRelay,
      });
      setStacks(fetchedStacks);
    } catch (err) {
      console.error('Failed to fetch stacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStack = async (stack: Stack) => {
    if (deletingStackId) return;

    setDeletingStackId(stack.dTag);
    try {
      await deleteStack({
        eventId: stack.id,
        dTag: stack.dTag,
        relays,
        secretKey,
      });
      removeStack(stack.dTag);
    } catch (err) {
      console.error('Failed to delete stack:', err);
    } finally {
      setDeletingStackId(null);
    }
  };

  const handleDeleteItem = async (stack: Stack, item: StackItem) => {
    const itemKey = `${stack.dTag}:${item.pubkey}:${item.identifier}`;
    if (deletingItemKey) return;

    setDeletingItemKey(itemKey);

    // Optimistic update
    removeItemFromStack(stack.dTag, item);

    try {
      // Get updated items from store
      const currentStack = useStackStore.getState().stacks[stack.dTag];
      if (!currentStack) {
        // Stack was deleted, nothing to do
        return;
      }

      await publishStack({
        dTag: stack.dTag,
        name: stack.name,
        description: stack.description,
        image: stack.image,
        items: currentStack.items,
        relays,
        secretKey,
      });
    } catch (err) {
      console.error('Failed to remove item from stack:', err);
      // Revert optimistic update
      addItemToStack(stack.dTag, item);
    } finally {
      setDeletingItemKey(null);
    }
  };

  const handleSelectBlog = (blog: Blog) => {
    onSelectBlog?.(blog);
  };

  const stacksList = Object.values(stacks);
  const isLoggedIn = isHydrated && !!pubkey;
  const selectedStack = selectedStackId ? stacks[selectedStackId] : null;
  const stackPubkeys = selectedStack
    ? Array.from(new Set(selectedStack.items.map((item) => item.pubkey)))
    : [];
  const { isLoading: isLoadingProfiles, isFetching: isFetchingProfiles, getProfile } = useProfiles(stackPubkeys, relays);
  const stackItemsQuery = useQuery({
    queryKey: ['stack-blogs', selectedStack?.dTag, activeRelay],
    queryFn: async () => {
      if (!selectedStack) return [];
      const results = await Promise.all(
        selectedStack.items.map((item) =>
          fetchBlogByAddress({
            pubkey: item.pubkey,
            identifier: item.identifier,
            relay: item.relay || activeRelay,
          })
        )
      );
      return results.map((blog, index) => ({ item: selectedStack.items[index], blog }));
    },
    enabled: !!selectedStack && !!activeRelay,
  });

  return (
    <div
      className="fixed inset-y-0 z-50 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      <PanelRail onClose={onClose} />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        {selectedStack ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSelectedStackId(null)}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
              title="Back to stacks"
              aria-label="Back to stacks"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-foreground/80 flex-1 min-w-0 truncate">
              {selectedStack.name}
            </h2>
          </div>
        ) : (
          <h2 className="text-sm font-semibold text-foreground/80">
            My Stacks
          </h2>
        )}
        <div className="flex items-center gap-1">
          {selectedStack && isLoggedIn && (
            <button
              onClick={() => stackItemsQuery.refetch()}
              disabled={stackItemsQuery.isFetching || stackItemsQuery.isLoading}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground disabled:opacity-50"
              title="Refresh stack"
              aria-label="Refresh stack"
            >
              <RefreshCwIcon className={`w-4 h-4 ${stackItemsQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          )}
          {!selectedStack && isLoggedIn && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground disabled:opacity-50"
              title="Refresh stacks"
              aria-label="Refresh stacks"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground"
            title="Close panel"
            aria-label="Close panel"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Log in to see your stacks
          </div>
        )}

        {isLoggedIn && !selectedStack && isLoading && stacksList.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <Loader2Icon className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading stacks...
          </div>
        )}

        {isLoggedIn && !selectedStack && !isLoading && stacksList.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No stacks yet. Add articles to stacks while reading.
          </div>
        )}

        {isLoggedIn && !selectedStack && (
          <div className="divide-y divide-border">
            {stacksList.map((stack) => (
              <StackDisplay
                key={stack.dTag}
                stack={stack}
                onSelectStack={(stackToOpen) => setSelectedStackId(stackToOpen.dTag)}
                onDeleteStack={handleDeleteStack}
                isDeletingStack={deletingStackId === stack.dTag}
              />
            ))}
          </div>
        )}

        {isLoggedIn && selectedStack && (
          <div>
            {stackItemsQuery.isLoading && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Loader2Icon className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading stack...
              </div>
            )}
            {!stackItemsQuery.isLoading && selectedStack.items.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No articles in this stack
              </div>
            ) : (
              !stackItemsQuery.isLoading && (
                <ul className="divide-y divide-border">
                  {stackItemsQuery.data?.map(({ item, blog }) => {
                    const itemKey = `${selectedStack.dTag}:${item.pubkey}:${item.identifier}`;
                    return (
                      <StackItemDisplay
                        key={itemKey}
                        stack={selectedStack}
                        item={item}
                        blog={blog}
                        onSelectBlog={handleSelectBlog}
                        onDeleteItem={handleDeleteItem}
                        isDeleting={deletingItemKey === itemKey}
                        selectedBlogId={selectedBlogId}
                        getProfile={getProfile}
                        isLoadingProfiles={isLoadingProfiles}
                        isFetchingProfiles={isFetchingProfiles}
                      />
                    );
                  })}
                </ul>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
