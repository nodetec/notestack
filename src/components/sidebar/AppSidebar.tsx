'use client';

import { useState, useEffect } from 'react';
import { FileTextIcon, FileEditIcon, ServerIcon, PlusIcon, SunIcon, MoonIcon, GlobeIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
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
