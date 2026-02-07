'use client';

import Link from 'next/link';
import { PenLineIcon } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/sidebar/AppSidebar';
import SettingsView from '@/components/sidebar/SettingsView';
import ContentHeader from '@/components/layout/ContentHeader';
import LoginButton from '@/components/auth/LoginButton';

export default function RelaysPage() {
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
            <SettingsView />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
