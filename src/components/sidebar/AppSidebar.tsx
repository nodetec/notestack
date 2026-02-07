'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileEditIcon, ServerIcon, PlusIcon, HouseIcon, HighlighterIcon, LayersIcon, HashIcon, ChevronDownIcon, XIcon, UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { nip19 } from 'nostr-tools';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTagStore } from '@/lib/stores/tagStore';
import { fetchInterestTags } from '@/lib/nostr/fetch';
import { publishInterestTagsList } from '@/lib/nostr/publish';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserWithKeys } from '@/types/auth';

export default function AppSidebar() {
  const { setOpenMobile, state: sidebarState, isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const userPubkey = user?.publicKey;
  const { relays, activeRelay, setActiveRelay } = useSettingsStore();
  const profileHref = userPubkey ? `/author/${nip19.npubEncode(userPubkey)}` : '/login';
  const isOwnProfileRoute = !!userPubkey && pathname === profileHref;

  // Tags section state
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const { tags, activeTag, setTags, addTag, removeTag, setActiveTag } = useTagStore();

  const { data: nostrTags } = useQuery({
    queryKey: ['interest-tags', userPubkey, activeRelay],
    queryFn: () => fetchInterestTags({ pubkey: userPubkey!, relay: activeRelay }),
    enabled: !!userPubkey && !!activeRelay,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!userPubkey || !nostrTags) return;
    setTags(nostrTags);
  }, [nostrTags, setTags, userPubkey]);

  const publishTags = async (nextTags: string[]) => {
    if (!userPubkey) return;

    try {
      const results = await publishInterestTagsList({
        tags: nextTags,
        relays,
        secretKey: user?.secretKey,
      });
      const successCount = results.filter((result) => result.success).length;
      if (successCount === 0) {
        toast.error('Failed to save tags to relays');
      }
    } catch (error) {
      toast.error('Failed to save tags to relays', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleTagClick = (tag: string) => {
    const normalized = tag.toLowerCase().trim().replace(/^#/, '');
    const nextActiveTag = activeTag === normalized ? null : normalized;

    if (nextActiveTag === null) {
      // If clicking the same tag, clear the filter
      setActiveTag(null);
    } else {
      // Set the filter and open Home view
      setActiveTag(nextActiveTag);
    }
    const targetPath = isHomeRoute ? pathname : '/';
    const feedParam = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('feed')
      : null;
    const nextParams = new URLSearchParams();
    if ((targetPath === '/' || targetPath === '/explore') && feedParam === 'following') {
      nextParams.set('feed', 'following');
    }
    if (nextActiveTag) {
      nextParams.set('tag', nextActiveTag);
    }
    const query = nextParams.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath);
    setOpenMobile(false);
  };

  const handleAddTag = () => {
    const normalized = newTagInput.toLowerCase().trim().replace(/^#/, '');
    if (!normalized) return;

    const nextTags = tags.includes(normalized)
      ? tags
      : [...tags, normalized].sort();
    addTag(normalized);
    setNewTagInput('');
    setIsAddingTag(false);
    publishTags(nextTags);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  // Extract hostname from relay URL for display
  const relayHost = activeRelay ? new URL(activeRelay).hostname : null;
  const isHomeRoute = pathname === '/' || pathname === '/explore';
  const isDraftsRoute = pathname === '/drafts';
  const isHighlightsRoute = pathname === '/highlights';
  const isStacksRoute = pathname === '/stacks';
  const isRelaysRoute = pathname === '/relays';

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Home"
                  isActive={isHomeRoute}
                  asChild
                >
                  <Link
                    href="/"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <HouseIcon />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Drafts"
                  isActive={isDraftsRoute}
                  asChild
                >
                  <Link
                    href="/drafts"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <FileEditIcon />
                    <span>Drafts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Highlights"
                  isActive={isHighlightsRoute}
                  asChild
                >
                  <Link
                    href="/highlights"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <HighlighterIcon />
                    <span>Highlights</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Stacks"
                  isActive={isStacksRoute}
                  asChild
                >
                  <Link
                    href="/stacks"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <LayersIcon />
                    <span>Stacks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Relays"
                  isActive={isRelaysRoute}
                  asChild
                >
                  <Link
                    href="/relays"
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-2"
                  >
                    <ServerIcon />
                    <span>Relays</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Profile"
                  isActive={isOwnProfileRoute}
                  asChild
                >
                  <Link
                    href={profileHref}
                    onClick={() => {
                      setOpenMobile(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <UserIcon />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags Section - only show when sidebar is expanded */}
        {sidebarState !== 'collapsed' && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground/80">
                  <div className="flex items-center gap-2">
                    <HashIcon className="w-4 h-4" />
                    <span>Tags</span>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${isTagsOpen ? '' : '-rotate-90'}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {tags.map((tag) => (
                        <SidebarMenuItem key={tag} className="group relative">
                          <SidebarMenuButton
                            onClick={() => handleTagClick(tag)}
                            isActive={activeTag === tag}
                          >
                            <span className="truncate">#{tag}</span>
                          </SidebarMenuButton>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextTags = tags.filter((t) => t !== tag);
                              removeTag(tag);
                              publishTags(nextTags);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground"
                            aria-label={`Remove ${tag}`}
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        {isAddingTag ? (
                          <div className="flex items-center gap-1 px-2 py-1">
                            <span className="text-muted-foreground">#</span>
                            <input
                              type="text"
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={handleTagKeyDown}
                              onBlur={() => {
                                if (!newTagInput.trim()) {
                                  setIsAddingTag(false);
                                }
                              }}
                              placeholder="tag name"
                              autoFocus
                              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                        ) : (
                          <SidebarMenuButton onClick={() => setIsAddingTag(true)}>
                            <PlusIcon className="w-4 h-4" />
                            <span>Add tag</span>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-sidebar-accent rounded-md transition-colors text-left">
                      <ServerIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground/80 truncate flex-1">
                        {relayHost || 'No relay'}
                      </span>
                      {(sidebarState !== 'collapsed' || isMobile) && (
                        <ChevronDownIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  hidden={sidebarState !== 'collapsed' || isMobile}
                >
                  {activeRelay || 'No relay selected'}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuRadioGroup value={activeRelay} onValueChange={setActiveRelay}>
                  {relays.map((relay) => {
                    const host = new URL(relay).hostname;
                    return (
                      <DropdownMenuRadioItem key={relay} value={relay}>
                        {host}
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
