'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2Icon, LayersIcon, PlusIcon } from 'lucide-react';
import type { UserWithKeys } from '@/types/auth';
import type { Blog, StackItem } from '@/lib/nostr/types';
import { useStackStore } from '@/lib/stores/stackStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { fetchUserStacks, publishStack } from '@/lib/nostr/stacks';
import { toast } from 'sonner';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface StackMenuSubProps {
  blog: Blog;
}

export default function StackMenuSub({ blog }: StackMenuSubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savingStacks, setSavingStacks] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newStackName, setNewStackName] = useState('');

  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const isLoggedIn = sessionStatus === 'authenticated' && !!pubkey;

  const {
    stacks,
    setStacks,
    isArticleInStack,
    addItemToStack,
    removeItemFromStack,
    addStack,
    updateStack,
    isLoading,
    setLoading,
  } = useStackStore();

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);

  useEffect(() => {
    if (!isOpen || !pubkey || !activeRelay) return;

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
  }, [isOpen, pubkey, activeRelay, setStacks, setLoading]);

  const stacksList = Object.values(stacks).sort((a, b) => b.createdAt - a.createdAt);

  const handleToggleStack = async (dTag: string, checked: boolean) => {
    const stack = stacks[dTag];
    if (!stack) return;

    setSavingStacks((prev) => new Set(prev).add(dTag));

    const item: StackItem = {
      kind: 30023,
      pubkey: blog.pubkey,
      identifier: blog.dTag,
      relay: activeRelay,
    };

    // Optimistic update
    if (checked) {
      addItemToStack(dTag, item);
    } else {
      removeItemFromStack(dTag, item);
    }

    try {
      const currentStack = useStackStore.getState().stacks[dTag];
      if (!currentStack) return;

      const result = await publishStack({
        dTag: stack.dTag,
        name: stack.name,
        description: stack.description,
        image: stack.image,
        items: currentStack.items,
        relays,
        secretKey,
      });
      updateStack(dTag, { createdAt: result.event.createdAt });
      toast.success(checked ? 'Added to stack' : 'Removed from stack', {
        description: stack.name,
      });
    } catch (err) {
      console.error('Failed to update stack:', err);
      // Revert optimistic update
      if (checked) {
        removeItemFromStack(dTag, item);
      } else {
        addItemToStack(dTag, item);
      }
    } finally {
      setSavingStacks((prev) => {
        const next = new Set(prev);
        next.delete(dTag);
        return next;
      });
    }
  };

  const handleCreateStack = async () => {
    if (!newStackName.trim() || !pubkey) return;

    setIsCreating(true);

    const stackName = newStackName.trim();
    const dTag = `stack-${Date.now()}`;
    const item: StackItem = {
      kind: 30023,
      pubkey: blog.pubkey,
      identifier: blog.dTag,
      relay: activeRelay,
    };

    try {
      const result = await publishStack({
        dTag,
        name: stackName,
        items: [item],
        relays,
        secretKey,
      });

      addStack({
        id: result.event.id,
        pubkey: result.event.pubkey,
        dTag,
        name: stackName,
        createdAt: result.event.createdAt,
        items: [item],
      });

      toast.success('Stack created', {
        description: stackName,
      });
      setNewStackName('');
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create stack:', err);
      toast.error('Failed to create stack', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateStack();
    } else if (e.key === 'Escape') {
      setNewStackName('');
    }
  };

  return (
    <DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger>
        <LayersIcon className="w-4 h-4" />
        Add to stack
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {!isLoggedIn && (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            Sign in to use stacks
          </div>
        )}
        {isLoggedIn && isLoading && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2Icon className="w-3 h-3 animate-spin mr-2" />
            Loading stacks...
          </div>
        )}
        {isLoggedIn && !isLoading && stacksList.length === 0 && (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            No stacks yet
          </div>
        )}
        {isLoggedIn && !isLoading && stacksList.length > 0 && (
          <>
            {stacksList.map((stack) => {
              const isChecked = isArticleInStack(stack.dTag, blog.pubkey, blog.dTag);
              const isSaving = savingStacks.has(stack.dTag);
              return (
                <DropdownMenuCheckboxItem
                  key={stack.dTag}
                  checked={isChecked}
                  disabled={isSaving}
                  onCheckedChange={(checked) => handleToggleStack(stack.dTag, checked)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="flex-1 truncate">{stack.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {isSaving ? (
                      <Loader2Icon className="w-3 h-3 animate-spin" />
                    ) : (
                      stack.items.length
                    )}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </>
        )}
        {isLoggedIn && (
          <>
            <div className="mx-2 my-1 h-px bg-border" />
            <div className="p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStackName}
                  onChange={(e) => setNewStackName(e.target.value)}
                  onKeyDown={handleCreateKeyDown}
                  placeholder="New stack name..."
                  className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
                  disabled={isCreating}
                />
                <button
                  type="button"
                  onClick={handleCreateStack}
                  disabled={!newStackName.trim() || isCreating}
                  className="h-6 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
                  aria-label="Create stack"
                >
                  {isCreating ? (
                    <Loader2Icon className="w-3 h-3 animate-spin" />
                  ) : (
                    <PlusIcon className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
