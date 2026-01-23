'use client';

import { cn } from '@/lib/utils';

interface PanelRailProps {
  onClose: () => void;
  className?: string;
}

export default function PanelRail({ onClose, className }: PanelRailProps) {
  return (
    <button
      aria-label="Close panel"
      tabIndex={-1}
      onClick={onClose}
      title="Close panel"
      className={cn(
        "absolute inset-y-0 -right-3 z-20 hidden w-6 cursor-w-resize transition-all ease-linear sm:flex",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border",
        className
      )}
    />
  );
}
