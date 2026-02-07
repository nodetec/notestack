'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import AuthorArticlesFeed from '@/components/author/AuthorArticlesFeed';
import FollowingFeedPanel from '@/components/sidebar/FollowingFeedPanel';
import AuthorFeedPanel from '@/components/sidebar/AuthorFeedPanel';
import BlogListPanel from '@/components/sidebar/BlogListPanel';
import DraftsPanel from '@/components/sidebar/DraftsPanel';
import HighlightsPanel from '@/components/sidebar/HighlightsPanel';
import StacksPanel from '@/components/sidebar/StacksPanel';
import SettingsPanel from '@/components/sidebar/SettingsPanel';
import ProfilePanel from '@/components/sidebar/ProfilePanel';
import { useSession } from 'next-auth/react';
import type { UserWithKeys } from '@/types/auth';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { blogToNaddr } from '@/lib/nostr/naddr';
import type { Blog, Highlight } from '@/lib/nostr/types';

export default function AuthorPage() {
  const params = useParams<{ npub: string }>();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<string | null>('explore');
  const [selectedAuthorPubkey, setSelectedAuthorPubkey] = useState<string | null>(null);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const pubkey = user?.publicKey;
  const relays = useSettingsStore((state) => state.relays);
  const isPanelOpen = !!activePanel && activePanel !== 'explore';
  const npubParam = Array.isArray(params.npub) ? params.npub[0] : params.npub;

  const handlePanelChange = useCallback((panel: string | null) => {
    setActivePanel(panel ?? 'explore');
  }, []);

  const handleClosePanel = useCallback(() => {
    setActivePanel('explore');
  }, []);

  const handleSelectAuthor = useCallback((authorPubkey: string) => {
    setSelectedAuthorPubkey(authorPubkey);
    setActivePanel('author');
  }, []);

  const withPanelParam = useCallback((path: string) => {
    if (activePanel && activePanel !== 'explore') {
      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}panel=${encodeURIComponent(activePanel)}`;
    }
    return path;
  }, [activePanel]);

  const handleSelectBlog = useCallback((blog: Blog) => {
    const naddr = blogToNaddr(blog, relays);
    router.push(withPanelParam(`/${naddr}`), { scroll: false });
  }, [relays, router, withPanelParam]);

  const handleSelectDraft = useCallback((draftId: string) => {
    router.push(withPanelParam(`/draft/${draftId}`), { scroll: false });
  }, [router, withPanelParam]);

  const handleSelectHighlight = useCallback((highlight: Highlight) => {
    setSelectedHighlightId(highlight.id);
    if (highlight.source) {
      const naddr = blogToNaddr(
        { pubkey: highlight.source.pubkey, dTag: highlight.source.identifier },
        relays
      );
      router.push(withPanelParam(`/${naddr}`), { scroll: false });
    }
  }, [relays, router, withPanelParam]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar activePanel={activePanel} onPanelChange={handlePanelChange} />

      {/* Collapsible panels - kept mounted to preserve scroll position */}
      <div className={activePanel === 'following' ? '' : 'hidden'}>
        <FollowingFeedPanel onSelectBlog={handleSelectBlog} onSelectAuthor={handleSelectAuthor} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'author' ? '' : 'hidden'}>
        <AuthorFeedPanel
          pubkey={selectedAuthorPubkey}
          onSelectBlog={handleSelectBlog}
          onClose={handleClosePanel}
          onClearAuthor={() => setSelectedAuthorPubkey(null)}
        />
      </div>
      <div className={activePanel === 'blogs' ? '' : 'hidden'}>
        <BlogListPanel onSelectBlog={handleSelectBlog} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'drafts' ? '' : 'hidden'}>
        <DraftsPanel onSelectDraft={handleSelectDraft} onClose={handleClosePanel} />
      </div>
      <div className={activePanel === 'highlights' ? '' : 'hidden'}>
        <HighlightsPanel onSelectHighlight={handleSelectHighlight} onClose={handleClosePanel} selectedHighlightId={selectedHighlightId} />
      </div>
      <div className={activePanel === 'stacks' ? '' : 'hidden'}>
        <StacksPanel
          onSelectBlog={handleSelectBlog}
          onSelectAuthor={handleSelectAuthor}
          onClose={handleClosePanel}
        />
      </div>
      {activePanel === 'relays' && (
        <SettingsPanel onClose={handleClosePanel} />
      )}
      {activePanel === 'profile' && (
        <ProfilePanel onClose={handleClosePanel} pubkey={pubkey} />
      )}

      <SidebarInset className={`bg-background transition-[margin] duration-200 ease-linear ${isPanelOpen ? 'sm:ml-72' : ''}`}>
        <AuthorArticlesFeed npub={npubParam ?? ''} />
      </SidebarInset>
    </SidebarProvider>
  );
}
