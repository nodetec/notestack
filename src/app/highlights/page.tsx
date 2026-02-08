'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PenLineIcon } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import HighlightsView from '@/components/sidebar/HighlightsView';
import ContentHeader from '@/components/layout/ContentHeader';
import LoginButton from '@/components/auth/LoginButton';
import ThemeToggleButton from '@/components/theme/ThemeToggleButton';
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
    const nextParams = new URLSearchParams({
      highlight: highlight.id,
    });
    router.push(`/${naddr}?${nextParams.toString()}`, { scroll: false });
  }, [relays, router]);

  return (
    <AppShell
      header={
        <ContentHeader
          className="bg-background/80 backdrop-blur"
          innerClassName="px-3 sm:px-6 py-2 min-h-12"
          right={
            <>
              <Link
                href="/draft/new"
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <PenLineIcon className="w-4 h-4" />
                <span>Write</span>
              </Link>
              <ThemeToggleButton />
              <LoginButton />
            </>
          }
        />
      }
    >
      <div className="min-h-0 flex-1">
        <HighlightsView
          onSelectHighlight={handleSelectHighlight}
          selectedHighlightId={selectedHighlightId}
        />
      </div>
    </AppShell>
  );
}
