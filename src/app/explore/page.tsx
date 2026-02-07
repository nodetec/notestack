'use client';

import { Suspense } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import ExploreFeed from '@/components/explore/ExploreFeed';

export default function ExplorePage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
          <ExploreFeed />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
