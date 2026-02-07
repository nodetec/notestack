'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import HighlightsView from '@/components/sidebar/HighlightsView';
import ContentHeader from '@/components/layout/ContentHeader';
import LoginButton from '@/components/auth/LoginButton';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { blogToNaddr } from '@/lib/nostr/naddr';
import type { Highlight } from '@/lib/nostr/types';

export default function HighlightsPage() {
  const router = useRouter();
  const relays = useSettingsStore((state) => state.relays);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);

  const handleSelectHighlight = useCallback((highlight: Highlight) => {
    setSelectedHighlightId(highlight.id);
    if (!highlight.source) return;
    const naddr = blogToNaddr(
      { pubkey: highlight.source.pubkey, dTag: highlight.source.identifier },
      relays,
    );
    router.push(`/${naddr}`, { scroll: false });
  }, [relays, router]);

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
            <HighlightsView
              onSelectHighlight={handleSelectHighlight}
              selectedHighlightId={selectedHighlightId}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
