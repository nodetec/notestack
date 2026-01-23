'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, UserPlusIcon, UserMinusIcon, Loader2Icon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fetchContactListEvent } from '@/lib/nostr/fetch';
import { publishContactList } from '@/lib/nostr/publish';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import { toast } from 'sonner';

interface AuthorDropdownProps {
  authorPubkey: string;
  authorName?: string;
  authorPicture?: string;
}

export default function AuthorDropdown({
  authorPubkey,
  authorName,
  authorPicture,
}: AuthorDropdownProps) {
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const userPubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user's contact list to check if already following
  const { data: contactListEvent } = useQuery({
    queryKey: ['contact-list', userPubkey, activeRelay],
    queryFn: () => fetchContactListEvent({ pubkey: userPubkey!, relay: activeRelay }),
    enabled: !!userPubkey,
    staleTime: 30000,
  });

  // Check if user is following this author
  const isFollowing = contactListEvent?.tags.some(
    (tag) => tag[0] === 'p' && tag[1] === authorPubkey
  ) ?? false;

  // Don't show dropdown for own profile
  const isOwnProfile = userPubkey === authorPubkey;

  const handleFollow = async () => {
    if (!userPubkey || isUpdating) return;

    setIsUpdating(true);
    try {
      // Get existing tags or start fresh
      const existingTags = contactListEvent?.tags || [];
      const existingContent = contactListEvent?.content || '';

      // Add the new follow to the end (per NIP-02 recommendation)
      const newTags = [...existingTags, ['p', authorPubkey, activeRelay]];

      const results = await publishContactList({
        tags: newTags,
        content: existingContent,
        relays,
        secretKey,
      });

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`Now following ${authorName || 'user'}`);
        // Invalidate contact list queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['contact-list'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } else {
        toast.error('Failed to follow user');
      }
    } catch (err) {
      console.error('Failed to follow:', err);
      toast.error('Failed to follow user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnfollow = async () => {
    if (!userPubkey || isUpdating || !contactListEvent) return;

    setIsUpdating(true);
    try {
      // Remove the author from the tags
      const newTags = contactListEvent.tags.filter(
        (tag) => !(tag[0] === 'p' && tag[1] === authorPubkey)
      );

      const results = await publishContactList({
        tags: newTags,
        content: contactListEvent.content || '',
        relays,
        secretKey,
      });

      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast.success(`Unfollowed ${authorName || 'user'}`);
        // Invalidate contact list queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['contact-list'] });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      } else {
        toast.error('Failed to unfollow user');
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toast.error('Failed to unfollow user');
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = authorName || 'Unknown';

  // If not logged in or viewing own profile, just show static author info
  if (!userPubkey || isOwnProfile) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {authorPicture ? (
          <img
            src={authorPicture}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
              {displayName}
            </span>
          </TooltipTrigger>
          <TooltipContent>{displayName}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 min-w-0 hover:bg-muted rounded-md px-1.5 py-1 -mx-1.5 -my-1 transition-colors"
          title={displayName}
        >
          {authorPicture ? (
            <img
              src={authorPicture}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0" />
          )}
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">
            {displayName}
          </span>
          <ChevronDownIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {isFollowing ? (
          <DropdownMenuItem
            onClick={handleUnfollow}
            disabled={isUpdating}
            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            {isUpdating ? (
              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserMinusIcon className="w-4 h-4 mr-2" />
            )}
            Unfollow
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleFollow} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlusIcon className="w-4 h-4 mr-2" />
            )}
            Follow
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
