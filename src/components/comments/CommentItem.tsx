'use client';

import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import { MessageSquareIcon, Trash2Icon } from 'lucide-react';
import type { Comment } from '@/lib/nostr/types';
import type { Profile } from '@/lib/nostr/profiles';
import CommentForm from './CommentForm';

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
}

interface CommentItemProps {
  comment: CommentWithReplies;
  profiles: Map<string, Profile>;
  currentUserPubkey?: string;
  isLoggedIn: boolean;
  depth?: number;
  maxDepth?: number;
  onReply: (content: string, parentComment: { id: string; pubkey: string }) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function CommentItem({
  comment,
  profiles,
  currentUserPubkey,
  isLoggedIn,
  depth = 0,
  maxDepth = 3,
  onReply,
  onDelete,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profile = profiles.get(comment.pubkey);
  const displayName = profile?.name || `${nip19.npubEncode(comment.pubkey).slice(0, 12)}...`;
  const avatar = profile?.picture;
  const isOwnComment = currentUserPubkey === comment.pubkey;

  const handleReply = async (content: string) => {
    await onReply(content, { id: comment.id, pubkey: comment.pubkey });
    setShowReplyForm(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  // Flatten replies beyond max depth
  const shouldNest = depth < maxDepth;

  return (
    <div className={depth > 0 ? 'pl-4 border-l border-zinc-200 dark:border-zinc-700' : ''}>
      <div className="py-3">
        {/* Author info */}
        <div className="flex items-center gap-2 mb-1">
          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {displayName}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>

        {/* Comment content */}
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          {isLoggedIn && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <MessageSquareIcon className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {isOwnComment && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2Icon className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              onSubmit={handleReply}
              isLoggedIn={isLoggedIn}
              placeholder={`Reply to ${displayName}...`}
              submitLabel="Reply"
              autoFocus
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className={shouldNest ? '' : 'ml-0'}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              profiles={profiles}
              currentUserPubkey={currentUserPubkey}
              isLoggedIn={isLoggedIn}
              depth={shouldNest ? depth + 1 : depth}
              maxDepth={maxDepth}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
