'use client';

import { useState, useEffect } from 'react';
import { XIcon, ChevronDownIcon, Trash2Icon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { useStackStore } from '@/lib/stores/stackStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { fetchUserStacks, deleteStack, publishStack } from '@/lib/nostr/stacks';
import { fetchBlogByAddress } from '@/lib/nostr/fetch';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import type { Blog, Stack, StackItem } from '@/lib/nostr/types';
import { useSidebar } from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StacksPanelProps {
  onSelectBlog?: (blog: Blog) => void;
  onClose: () => void;
}


interface StackItemDisplayProps {
  stack: Stack;
  itemIndex: number;
  onSelectBlog: (blog: Blog) => void;
  onDeleteItem: (stack: Stack, item: StackItem) => void;
  isDeleting: boolean;
}

function StackItemDisplay({ stack, itemIndex, onSelectBlog, onDeleteItem, isDeleting }: StackItemDisplayProps) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const item = stack.items[itemIndex];

  useEffect(() => {
    const loadBlog = async () => {
      setIsLoading(true);
      try {
        const fetchedBlog = await fetchBlogByAddress({
          pubkey: item.pubkey,
          identifier: item.identifier,
          relay: item.relay || activeRelay,
        });
        setBlog(fetchedBlog);
      } catch (err) {
        console.error('Failed to fetch blog:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBlog();
  }, [item.pubkey, item.identifier, item.relay, activeRelay]);

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2Icon className="w-3 h-3 animate-spin" />
        Loading...
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="group relative px-4 py-2 text-sm text-muted-foreground italic flex items-center justify-between">
        <span>Article not found</span>
        <button
          onClick={() => onDeleteItem(stack, item)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400 disabled:opacity-50 transition-opacity"
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

  return (
    <div className="group relative">
      <button
        onClick={() => onSelectBlog(blog)}
        className="w-full text-left px-4 py-2 pr-10 hover:bg-sidebar-accent transition-colors"
      >
        <p className="text-sm text-foreground line-clamp-2">
          {blog.title || 'Untitled'}
        </p>
        {blog.summary && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {blog.summary}
          </p>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteItem(stack, item);
        }}
        disabled={isDeleting}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400 disabled:opacity-50 transition-opacity"
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

interface StackDisplayProps {
  stack: Stack;
  onSelectBlog: (blog: Blog) => void;
  onDeleteStack: (stack: Stack) => void;
  onDeleteItem: (stack: Stack, item: StackItem) => void;
  isDeletingStack: boolean;
  deletingItemKey: string | null;
}

function StackDisplay({ stack, onSelectBlog, onDeleteStack, onDeleteItem, isDeletingStack, deletingItemKey }: StackDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group relative">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 hover:bg-sidebar-accent transition-colors">
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">
              {stack.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {stack.items.length} {stack.items.length === 1 ? 'article' : 'articles'}
            </p>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteStack(stack);
          }}
          disabled={isDeletingStack}
          className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:text-muted-foreground dark:hover:text-red-400 disabled:opacity-50 transition-opacity"
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
      <CollapsibleContent>
        <div className="border-l-2 border-border ml-3">
          {stack.items.length === 0 ? (
            <p className="px-4 py-2 text-sm text-muted-foreground italic">
              No articles in this stack
            </p>
          ) : (
            stack.items.map((item, index) => {
              const itemKey = `${stack.dTag}:${item.pubkey}:${item.identifier}`;
              return (
                <StackItemDisplay
                  key={itemKey}
                  stack={stack}
                  itemIndex={index}
                  onSelectBlog={onSelectBlog}
                  onDeleteItem={onDeleteItem}
                  isDeleting={deletingItemKey === itemKey}
                />
              );
            })
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function StacksPanel({ onSelectBlog, onClose }: StacksPanelProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [deletingStackId, setDeletingStackId] = useState<string | null>(null);
  const [deletingItemKey, setDeletingItemKey] = useState<string | null>(null);

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

  return (
    <div
      className="fixed inset-y-0 z-50 h-svh border-r border-sidebar-border bg-sidebar flex flex-col overflow-hidden transition-[left,width] duration-200 ease-linear w-full sm:w-72"
      style={{ left: isMobile ? 0 : `var(--sidebar-width${sidebarState === 'collapsed' ? '-icon' : ''})` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground/80">
          My Stacks
        </h2>
        <div className="flex items-center gap-1">
          {isLoggedIn && (
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

      {/* Stacks List */}
      <div className="flex-1 overflow-y-auto overscroll-none">
        {!isLoggedIn && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Log in to see your stacks
          </div>
        )}

        {isLoggedIn && isLoading && stacksList.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            <Loader2Icon className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading stacks...
          </div>
        )}

        {isLoggedIn && !isLoading && stacksList.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No stacks yet. Add articles to stacks while reading.
          </div>
        )}

        <div className="divide-y divide-border">
          {stacksList.map((stack) => (
            <StackDisplay
              key={stack.dTag}
              stack={stack}
              onSelectBlog={handleSelectBlog}
              onDeleteStack={handleDeleteStack}
              onDeleteItem={handleDeleteItem}
              isDeletingStack={deletingStackId === stack.dTag}
              deletingItemKey={deletingItemKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
