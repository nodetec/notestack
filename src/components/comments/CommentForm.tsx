'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoggedIn: boolean;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

export default function CommentForm({
  onSubmit,
  isLoggedIn,
  placeholder = 'Write a comment...',
  submitLabel = 'Comment',
  autoFocus = false,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400 py-3 text-center">
        Sign in to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        autoFocus={autoFocus}
        className="min-h-[80px] resize-none"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? <Spinner className="w-4 h-4" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}
