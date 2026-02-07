'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { nip19 } from 'nostr-tools';
import { PenLineIcon } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import StacksView from '@/components/sidebar/StacksView';
import ContentHeader from '@/components/layout/ContentHeader';
import LoginButton from '@/components/auth/LoginButton';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { blogToNaddr } from '@/lib/nostr/naddr';
import type { Blog } from '@/lib/nostr/types';

export default function StacksPage() {
  const router = useRouter();
  const relays = useSettingsStore((state) => state.relays);

  const handleSelectBlog = useCallback((blog: Blog) => {
    const naddr = blogToNaddr(blog, relays);
    router.push(`/${naddr}`, { scroll: false });
  }, [relays, router]);

  const handleSelectAuthor = useCallback((pubkey: string) => {
    router.push(`/author/${nip19.npubEncode(pubkey)}`);
  }, [router]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <div className="flex min-h-0 flex-1 flex-col">
          <ContentHeader
            className="z-10 bg-background/80 backdrop-blur"
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
                <LoginButton />
              </>
            }
          />
          <div className="min-h-0 flex-1">
            <StacksView
              onSelectBlog={handleSelectBlog}
              onSelectAuthor={handleSelectAuthor}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
