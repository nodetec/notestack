'use client';

import { ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ZapDialog from './ZapDialog';
import type { Blog } from '@/lib/nostr/types';

interface ZapButtonProps {
  blog: Blog;
}

export default function ZapButton({ blog }: ZapButtonProps) {
  const articleAddress = `30023:${blog.pubkey}:${blog.dTag}`;

  return (
    <ZapDialog
      recipientPubkey={blog.pubkey}
      articleAddress={articleAddress}
      eventId={blog.id}
    >
      <Button
        size="sm"
        variant="ghost"
        title="Zap this article"
      >
        <ZapIcon className="w-4 h-4 text-red-500 dark:text-yellow-400" />
      </Button>
    </ZapDialog>
  );
}
