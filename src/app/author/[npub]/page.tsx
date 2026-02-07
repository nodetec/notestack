'use client';

import { useParams } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import AuthorArticlesFeed from '@/components/author/AuthorArticlesFeed';

export default function AuthorPage() {
  const params = useParams<{ npub: string }>();
  const npubParam = Array.isArray(params.npub) ? params.npub[0] : params.npub;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <AuthorArticlesFeed npub={npubParam ?? ''} />
      </SidebarInset>
    </SidebarProvider>
  );
}
