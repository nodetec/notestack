'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

export default function PageHeader({
  children,
  className,
  sticky = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-5 border-b border-border/70 bg-background/95 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        sticky && 'sticky top-0 z-20 lg:top-[var(--app-header-height)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
