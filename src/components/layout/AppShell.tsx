'use client';

import type { ReactNode } from 'react';
import AppSidebar from '@/components/sidebar/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
  insetClassName?: string;
  defaultSidebarOpen?: boolean;
}

export default function AppShell({
  header,
  children,
  insetClassName,
  defaultSidebarOpen = false,
}: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="flex min-h-svh w-full flex-col bg-background">
        {header}
        <div className="flex min-h-0 flex-1 w-full">
          <AppSidebar />
          <SidebarInset className={cn('bg-background', insetClassName)}>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
