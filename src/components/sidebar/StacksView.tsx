'use client';

import { useState, useEffect } from 'react';
import { XIcon, Loader2Icon, RefreshCwIcon, ArrowLeftIcon, MoreHorizontalIcon, DownloadIcon, Trash2Icon } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStackStore } from '@/lib/stores/stackStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { fetchUserStacks, deleteStack, publishStack } from '@/lib/nostr/stacks';
import { fetchBlogsByAddresses } from '@/lib/nostr/fetch';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import type { Blog, Stack, StackItem } from '@/lib/nostr/types';
import { broadcastEvent } from '@/lib/nostr/publish';
import EventJsonDialog from '@/components/ui/EventJsonDialog';
import { toast } from 'sonner';
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

interface StacksViewProps {
  onSelectBlog?: (blog: Blog) => void;
  onSelectAuthor?: (pubkey: string) => void;
  selectedBlogId?: string;
}


interface StackItemDisplayProps {
  stack: Stack;
  item: StackItem;
  blog: Blog | null;
  onSelectBlog: (blog: Blog) => void;
  onSelectAuthor?: (pubkey: string) => void;
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
  onSelectAuthor,
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
        <div className="w-full text-left py-2 rounded-md bg-sidebar-accent/40">
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
    <div className="group relative py-2">
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
        className={`w-full text-left py-2 rounded-md transition-colors cursor-default ${isSelected ? 'bg-sidebar-accent' : ''}`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              role={onSelectAuthor ? 'button' : undefined}
              tabIndex={onSelectAuthor ? 0 : undefined}
              onClick={(e) => {
                if (!onSelectAuthor) return;
                e.stopPropagation();
                onSelectAuthor(item.pubkey);
              }}
              onKeyDown={(e) => {
                if (!onSelectAuthor) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectAuthor(item.pubkey);
                }
              }}
              className={`flex items-center gap-2 min-w-0 overflow-hidden ${onSelectAuthor ? 'hover:underline cursor-default' : ''}`}
            >
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
                  <DownloadIcon className="w-4 h-4" />
                  Download markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(stack, item);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2Icon className="w-4 h-4" />
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
  onViewStackJson: (stack: Stack) => void;
  onBroadcastStack: (stack: Stack) => void;
  isDeletingStack: boolean;
  isBroadcasting: boolean;
}

function StackDisplay({
  stack,
  onSelectStack,
  onDeleteStack,
  onViewStackJson,
  onBroadcastStack,
  isDeletingStack,
  isBroadcasting,
}: StackDisplayProps) {
  return (
    <div className="group relative">
      <button
        onClick={() => onSelectStack(stack)}
        className="flex w-full items-center justify-between py-2 hover:bg-sidebar-accent transition-colors text-left"
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sidebar-accent text-muted-foreground transition-opacity"
            aria-label="Stack options"
          >
            <MoreHorizontalIcon className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewStackJson(stack);
            }}
            disabled={!stack.rawEvent}
          >
            View raw JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onBroadcastStack(stack);
            }}
            disabled={!stack.rawEvent || isBroadcasting}
          >
            {isBroadcasting ? 'Broadcasting...' : 'Broadcast'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDeleteStack(stack);
            }}
            className="text-red-600 focus:text-red-600"
            disabled={isDeletingStack}
          >
            {isDeletingStack ? 'Deleting...' : 'Delete stack'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function StacksView({
  onSelectBlog,
  onSelectAuthor,
  selectedBlogId,
}: StacksViewProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingStackId, setDeletingStackId] = useState<string | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [broadcastingStackId, setBroadcastingStackId] = useState<string | null>(null);
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [jsonEvent, setJsonEvent] = useState<unknown | null>(null);
  const queryClient = useQueryClient();

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
    updateStack,
    isLoading,
    setLoading,
  } = useStackStore();

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);

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
      return fetchedStacks;
    } catch (err) {
      console.error('Failed to fetch stacks:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStack = async () => {
    const refreshedStacks = await handleRefresh();
    if (!refreshedStacks || !selectedStackId) return;
    const stillExists = refreshedStacks.some((stack) => stack.dTag === selectedStackId);
    if (!stillExists) {
      setSelectedStackId(null);
      return;
    }
    await stackItemsQuery.refetch();
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

  const handleBroadcastStack = async (stack: Stack) => {
    if (broadcastingStackId || !stack.rawEvent) return;
    setBroadcastingStackId(stack.dTag);
    try {
      const results = await broadcastEvent(stack.rawEvent, relays);
      const successfulRelays = results.filter((r) => r.success);
      const successCount = successfulRelays.length;

      if (successCount > 0) {
        const relayList = successfulRelays.map((r) => r.relay).join('\n');
        toast.success('Stack broadcast!', {
          description: `Sent to ${successCount} relay${successCount !== 1 ? 's' : ''}:\n${relayList}`,
          duration: 5000,
        });
      } else {
        toast.error('Broadcast failed', {
          description: 'Failed to broadcast to any relay',
        });
      }
    } catch (err) {
      console.error('Failed to broadcast stack:', err);
      toast.error('Broadcast failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setBroadcastingStackId(null);
    }
  };

  const handleViewStackJson = (stack: Stack) => {
    if (!stack.rawEvent) return;
    setJsonEvent(stack.rawEvent);
    setIsJsonOpen(true);
  };

  const handleDeleteItem = async (stack: Stack, item: StackItem) => {
    const itemKey = `${stack.dTag}:${item.pubkey}:${item.identifier}`;
    if (deletingItemKey) return;

    setDeletingItemKey(itemKey);

    try {
      // Get updated items from store
      const currentStack = useStackStore.getState().stacks[stack.dTag];
      if (!currentStack) {
        // Stack was deleted, nothing to do
        return;
      }

      const result = await publishStack({
        dTag: stack.dTag,
        name: stack.name,
        description: stack.description,
        image: stack.image,
        items: currentStack.items.filter(
          (currentItem) =>
            !(
              currentItem.pubkey === item.pubkey &&
              currentItem.identifier === item.identifier
            )
        ),
        relays,
        secretKey,
      });
      updateStack(stack.dTag, { createdAt: result.event.createdAt });
      removeItemFromStack(stack.dTag, item);
      queryClient.setQueryData(
        ['stack-blogs', stack.dTag, activeRelay],
        (prev: { item: StackItem; blog: Blog | null }[] | undefined) => {
          if (!prev) return prev;
          return prev.filter(
            (entry) =>
              !(
                entry.item.pubkey === item.pubkey &&
                entry.item.identifier === item.identifier
              )
          );
        }
      );
    } catch (err) {
      console.error('Failed to remove item from stack:', err);
    } finally {
      setDeletingItemKey(null);
    }
  };

  const handleSelectBlog = (blog: Blog) => {
    onSelectBlog?.(blog);
  };

  const stacksList = Object.values(stacks).sort((a, b) => b.createdAt - a.createdAt);
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
      const orderedItems = [...selectedStack.items].reverse();
      const results = await fetchBlogsByAddresses({
        items: orderedItems,
        relay: activeRelay,
      });
      return results.map((blog, index) => ({ item: orderedItems[index], blog }));
    },
    enabled: !!selectedStack && !!activeRelay,
  });

  return (
    <div className="flex min-h-full w-full flex-col bg-background px-4 sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-2xl flex-col pt-6">
      {/* Header */}
      <div className="mb-5 border-b border-border/70 pt-2">
        <div className="flex items-center justify-between pb-2">
          {selectedStack ? (
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSelectedStackId(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title="Back to stacks"
                aria-label="Back to stacks"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                {selectedStack.name}
              </h2>
            </div>
          ) : (
            <h2 className="text-sm font-medium text-foreground">
              My Stacks
            </h2>
          )}
          <div className="flex items-center gap-1">
            {selectedStack && isLoggedIn && (
              <button
                onClick={handleRefreshStack}
                disabled={stackItemsQuery.isFetching || stackItemsQuery.isLoading}
                className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
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
                className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-50"
                title="Refresh stacks"
                aria-label="Refresh stacks"
              >
                <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
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
                onViewStackJson={handleViewStackJson}
                onBroadcastStack={handleBroadcastStack}
                isDeletingStack={deletingStackId === stack.dTag}
                isBroadcasting={broadcastingStackId === stack.dTag}
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
                        onSelectAuthor={onSelectAuthor}
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
      <EventJsonDialog
        open={isJsonOpen}
        onOpenChange={setIsJsonOpen}
        event={jsonEvent}
      />
    </div>
    </div>
  );
}
