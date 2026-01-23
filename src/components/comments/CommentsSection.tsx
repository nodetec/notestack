'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { fetchArticleComments, publishComment, deleteComment } from '@/lib/nostr/comments';
import { fetchProfiles } from '@/lib/nostr/profiles';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { UserWithKeys } from '@/types/auth';
import type { Comment } from '@/lib/nostr/types';
import CommentForm from './CommentForm';
import CommentItem, { type CommentWithReplies } from './CommentItem';

interface CommentsSectionProps {
  article: {
    pubkey: string;
    identifier: string;
    eventId?: string;
  };
}

function buildCommentTree(comments: Comment[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  const roots: CommentWithReplies[] = [];

  // First pass: create nodes with empty replies
  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  // Second pass: link children to parents
  for (const comment of comments) {
    const node = map.get(comment.id)!;
    if (comment.replyTo && map.has(comment.replyTo)) {
      map.get(comment.replyTo)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort by createdAt (oldest first for chronological reading)
  const sortByTime = (a: CommentWithReplies, b: CommentWithReplies) => a.createdAt - b.createdAt;

  const sortTree = (nodes: CommentWithReplies[]): void => {
    nodes.sort(sortByTime);
    for (const node of nodes) {
      sortTree(node.replies);
    }
  };

  sortTree(roots);
  return roots;
}

export default function CommentsSection({ article }: CommentsSectionProps) {
  const { data: session } = useSession();
  const user = session?.user as UserWithKeys | undefined;
  const currentUserPubkey = user?.publicKey;
  const secretKey = user?.secretKey;
  const isLoggedIn = !!currentUserPubkey;

  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay);
  const queryClient = useQueryClient();

  const commentsQueryKey = useMemo(
    () => ['comments', article.pubkey, article.identifier, activeRelay],
    [article.pubkey, article.identifier, activeRelay]
  );

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: () => fetchArticleComments({
      articlePubkey: article.pubkey,
      articleIdentifier: article.identifier,
      relay: activeRelay,
    }),
    staleTime: 30000,
  });

  // Extract unique pubkeys and fetch profiles
  const pubkeys = useMemo(() => {
    const uniquePubkeys = new Set(comments.map((c) => c.pubkey));
    return [...uniquePubkeys];
  }, [comments]);

  const { data: profiles = new Map() } = useQuery({
    queryKey: ['profiles', pubkeys, activeRelay],
    queryFn: () => fetchProfiles(pubkeys, activeRelay),
    enabled: pubkeys.length > 0,
    staleTime: 60000,
  });

  // Build comment tree
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  // Handle new top-level comment
  const handleSubmitComment = useCallback(async (content: string) => {
    const result = await publishComment({
      content,
      article,
      relays,
      secretKey,
    });

    // Optimistic update
    queryClient.setQueryData<Comment[]>(commentsQueryKey, (old) =>
      old ? [...old, result.comment] : [result.comment]
    );
  }, [article, relays, secretKey, queryClient, commentsQueryKey]);

  // Handle reply to a comment
  const handleReply = useCallback(async (
    content: string,
    parentComment: { id: string; pubkey: string }
  ) => {
    const result = await publishComment({
      content,
      article,
      parentComment,
      relays,
      secretKey,
    });

    // Optimistic update
    queryClient.setQueryData<Comment[]>(commentsQueryKey, (old) =>
      old ? [...old, result.comment] : [result.comment]
    );
  }, [article, relays, secretKey, queryClient, commentsQueryKey]);

  // Handle delete
  const handleDelete = useCallback(async (commentId: string) => {
    await deleteComment({
      eventId: commentId,
      relays,
      secretKey,
    });

    // Optimistic update - remove comment and its replies
    queryClient.setQueryData<Comment[]>(commentsQueryKey, (old) => {
      if (!old) return old;

      // Find all comment IDs to remove (the comment and all replies to it)
      const idsToRemove = new Set<string>();

      const collectReplies = (id: string) => {
        idsToRemove.add(id);
        for (const comment of old) {
          if (comment.replyTo === id) {
            collectReplies(comment.id);
          }
        }
      };

      collectReplies(commentId);
      return old.filter((c) => !idsToRemove.has(c.id));
    });
  }, [relays, secretKey, queryClient, commentsQueryKey]);

  const commentCount = comments.length;

  return (
    <div className="border-t border-border mt-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageSquareIcon className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">
          Comments {commentCount > 0 && `(${commentCount})`}
        </h2>
      </div>

      {/* New comment form */}
      <div className="mb-6">
        <CommentForm
          onSubmit={handleSubmitComment}
          isLoggedIn={isLoggedIn}
          placeholder="Write a comment..."
        />
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading comments...
        </div>
      ) : commentTree.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-border">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              profiles={profiles}
              currentUserPubkey={currentUserPubkey}
              isLoggedIn={isLoggedIn}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
