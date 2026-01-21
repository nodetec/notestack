'use client';

import { useState, useEffect } from 'react';
import { FileTextIcon, FileEditIcon, ServerIcon, PlusIcon, SunIcon, MoonIcon, GlobeIcon, HighlighterIcon, LayersIcon, HashIcon, ChevronDownIcon, XIcon, HeartIcon } from 'lucide-react';
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

interface AppSidebarProps {
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
  onNewArticle?: () => void;
}

export default function AppSidebar({ activePanel, onPanelChange, onNewArticle }: AppSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setOpenMobile, state: sidebarState, isMobile } = useSidebar();
  const activeRelay = useSettingsStore((state) => state.activeRelay);

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

  const handleNewArticle = () => {
    onNewArticle?.();
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
      // Set the filter and open Explore panel
      setActiveTag(tag);
      onPanelChange('explore');
    }
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
    <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800">
      <SidebarHeader className="border-b border-sidebar-border p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-3 cursor-default">
              <ServerIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                {relayHost || 'No relay'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            hidden={sidebarState !== 'collapsed' || isMobile}
          >
            {activeRelay || 'No relay selected'}
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Explore"
                  isActive={activePanel === 'explore'}
                  onClick={() => handleClick('explore')}
                >
                  <GlobeIcon />
                  <span>Explore</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="My Blogs"
                  isActive={activePanel === 'blogs'}
                  onClick={() => handleClick('blogs')}
                >
                  <FileTextIcon />
                  <span>My Blogs</span>
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
                  tooltip="New Article"
                  onClick={handleNewArticle}
                  className="bg-purple-600 text-white hover:bg-purple-700 hover:text-white dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  <PlusIcon />
                  <span>New Article</span>
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
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500"
                            aria-label={`Remove ${tag}`}
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </SidebarMenuItem>
                      ))}
                      <SidebarMenuItem>
                        {isAddingTag ? (
                          <div className="flex items-center gap-1 px-2 py-1">
                            <span className="text-zinc-500">#</span>
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
                              className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
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
