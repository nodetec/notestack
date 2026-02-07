'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface ContentHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
  brandText?: string;
  showBrand?: boolean;
  className?: string;
  innerClassName?: string;
  leftClassName?: string;
  rightClassName?: string;
  brandClassName?: string;
  triggerClassName?: string;
  showSidebarTrigger?: boolean;
  sticky?: boolean;
  brandHref?: string;
}

export default function ContentHeader({
  left,
  right,
  brandText = 'Notestack',
  showBrand = true,
  className,
  innerClassName,
  leftClassName,
  rightClassName,
  brandClassName,
  triggerClassName,
  showSidebarTrigger = true,
  sticky = true,
  brandHref = '/',
}: ContentHeaderProps) {
  return (
    <header
      className={cn(
        'z-40 shrink-0 border-b border-border bg-background',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-2 lg:px-3 py-2 min-h-12',
          innerClassName,
        )}
      >
        <div
          className={cn(
            'flex flex-1 items-center gap-2 min-w-0 overflow-hidden',
            leftClassName,
          )}
        >
          {showSidebarTrigger && (
            <SidebarTrigger className={cn('lg:hidden', triggerClassName)} />
          )}
          {showBrand && (
            <Link
              href={brandHref}
              className={cn(
                'shrink-0 text-base font-semibold tracking-[0.02em] text-foreground/85 font-[family-name:var(--font-merriweather)]',
                brandClassName,
              )}
            >
              {brandText}
            </Link>
          )}
          {left}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 lg:gap-2 justify-end shrink-0',
            rightClassName,
          )}
        >
          {right}
        </div>
      </div>
    </header>
  );
}
