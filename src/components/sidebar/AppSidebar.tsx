'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileEditIcon, ServerIcon, PlusIcon, SunIcon, MoonIcon, HouseIcon, HighlighterIcon, LayersIcon, HashIcon, ChevronDownIcon, XIcon, HeartIcon, UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { nip19 } from 'nostr-tools';
import { useTheme } from 'next-themes';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTagStore } from '@/lib/stores/tagStore';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarHeader,
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

interface AppSidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
}

export default function AppSidebar({ activePanel, onPanelChange }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
  const { tags, activeTag, addTag, removeTag, setActiveTag } = useTagStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (panel: string) => {
    onPanelChange(activePanel === panel ? null : panel);
    setOpenMobile(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      // If clicking the same tag, clear the filter
      setActiveTag(null);
    } else {
      // Set the filter and open Home view
      setActiveTag(tag);
    }
    router.push('/');
    setOpenMobile(false);
  };

  const handleAddTag = () => {
    if (newTagInput.trim()) {
      addTag(newTagInput);
      setNewTagInput('');
      setIsAddingTag(false);
    }
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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-0.5">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 px-3 py-3 hover:bg-sidebar-accent rounded-md transition-colors text-left">
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Home"
                  isActive={activePanel === 'explore'}
                  asChild
                >
                  <Link
                    href="/"
                    onClick={() => {
                      if (pathname === '/' || pathname === '/explore') {
                        onPanelChange('explore');
                      }
                      setOpenMobile(false);
                    }}
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
                  isActive={activePanel === 'drafts'}
                  onClick={() => handleClick('drafts')}
                >
                  <FileEditIcon />
                  <span>Drafts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Highlights"
                  isActive={activePanel === 'highlights'}
                  onClick={() => handleClick('highlights')}
                >
                  <HighlighterIcon />
                  <span>Highlights</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Stacks"
                  isActive={activePanel === 'stacks'}
                  onClick={() => handleClick('stacks')}
                >
                  <LayersIcon />
                  <span>Stacks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Relays"
                  isActive={activePanel === 'relays'}
                  onClick={() => handleClick('relays')}
                >
                  <ServerIcon />
                  <span>Relays</span>
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
                      onPanelChange(null);
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
                              removeTag(tag);
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Donate"
              asChild
            >
              <a href="https://getalby.com/p/chrisatmachine" target="_blank" rel="noopener noreferrer">
                <HeartIcon />
                <span>Donate</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
              onClick={toggleTheme}
            >
              {mounted ? (theme === 'dark' ? <SunIcon /> : <MoonIcon />) : <MoonIcon />}
              <span>{mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
