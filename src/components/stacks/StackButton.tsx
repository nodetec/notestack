'use client';

import { useState, useEffect } from 'react';
import { LayersIcon, PlusIcon, CheckIcon, Loader2Icon } from 'lucide-react';
import { useStackStore } from '@/lib/stores/stackStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { fetchUserStacks, publishStack } from '@/lib/nostr/stacks';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import type { Blog, StackItem } from '@/lib/nostr/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface StackButtonProps {
  blog: Blog;
}

export default function StackButton({ blog }: StackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [savingStacks, setSavingStacks] = useState<Set<string>>(new Set());

  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;

  const {
    stacks,
    setStacks,
    isArticleInStack,
    isArticleInAnyStack,
    addItemToStack,
    removeItemFromStack,
    addStack,
    isLoading,
    setLoading,
  } = useStackStore();

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);

  // Fetch stacks when dropdown opens
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

  const stacksList = Object.values(stacks);
  const isInAnyStack = isArticleInAnyStack(blog.pubkey, blog.dTag);

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
      // Get updated items
      const currentStack = useStackStore.getState().stacks[dTag];
      if (!currentStack) return;

      await publishStack({
        dTag: stack.dTag,
        name: stack.name,
        description: stack.description,
        image: stack.image,
        items: currentStack.items,
        relays,
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
        name: newStackName.trim(),
        items: [item],
        relays,
      });

      // Add to store
      addStack({
        id: result.event.id,
        pubkey: result.event.pubkey,
        dTag,
        name: newStackName.trim(),
        createdAt: result.event.createdAt,
        items: [item],
      });

      setNewStackName('');
    } catch (err) {
      console.error('Failed to create stack:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateStack();
    } else if (e.key === 'Escape') {
      setNewStackName('');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="relative"
          title={isInAnyStack ? 'In stack' : 'Add to stack'}
        >
          <LayersIcon className="w-4 h-4" />
          {isInAnyStack ? (
            <CheckIcon className="w-2.5 h-2.5 absolute bottom-1 right-1 text-green-500" />
          ) : (
            <PlusIcon className="w-2.5 h-2.5 absolute bottom-1 right-1 text-zinc-400" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-sm text-zinc-500">
            <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
            Loading stacks...
          </div>
        ) : stacksList.length === 0 ? (
          <div className="px-2 py-3 text-sm text-zinc-500 text-center">
            No stacks yet
          </div>
        ) : (
          stacksList.map((stack) => {
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
                <span className="text-xs text-zinc-400 ml-2">
                  {isSaving ? (
                    <Loader2Icon className="w-3 h-3 animate-spin" />
                  ) : (
                    stack.items.length
                  )}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })
        )}

        <DropdownMenuSeparator />

        <div className="p-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newStackName}
              onChange={(e) => setNewStackName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="New stack name..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-zinc-400"
              disabled={isCreating}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCreateStack}
              disabled={!newStackName.trim() || isCreating}
              className="h-6 px-2"
            >
              {isCreating ? (
                <Loader2Icon className="w-3 h-3 animate-spin" />
              ) : (
                <PlusIcon className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
