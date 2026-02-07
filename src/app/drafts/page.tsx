'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import DraftsView from '@/components/sidebar/DraftsView';
import ContentHeader from '@/components/layout/ContentHeader';
import LoginButton from '@/components/auth/LoginButton';

export default function DraftsPage() {
  const router = useRouter();

  const handleSelectDraft = useCallback((draftId: string) => {
    router.push(`/draft/${draftId}`, { scroll: false });
  }, [router]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <div className="flex min-h-0 flex-1 flex-col">
          <ContentHeader
            className="z-10 bg-background/80 backdrop-blur"
            innerClassName="px-3 sm:px-6 py-2 min-h-12"
            right={<LoginButton />}
          />
          <div className="min-h-0 flex-1">
            <DraftsView onSelectDraft={handleSelectDraft} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
