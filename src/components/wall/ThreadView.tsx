'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post, PostWithReplies } from '@/types/posts';
import { ReplyCard } from './ReplyCard';
import { ReplyComposer } from './ReplyComposer';
import { PostActions } from './PostActions';
import { AuthorBadge } from './AuthorBadge';
import { PostContent } from './PostContent';
import { formatDistanceToNow } from 'date-fns';

interface ThreadViewProps {
  post: Post & { author?: { name?: string; email?: string; role?: 'parent' | 'child' | 'admin' } };
  initialReplies?: Post[];
  currentUserId: string;
  familyId: string;
  onReplySubmitted?: (reply: Post) => void;
  onPostDeleted?: () => void;
}

export function ThreadView({
  post,
  initialReplies = [],
  currentUserId,
  familyId,
  onReplySubmitted,
  onPostDeleted,
}: ThreadViewProps) {
  const [replies, setReplies] = useState<Post[]>(initialReplies);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPostAuthor = post.author_id === currentUserId;
  const authorRole = post.author?.role || 'child';
  const authorName = post.author?.name || 'Unknown';

  // Load replies if not provided
  useEffect(() => {
    if (initialReplies.length === 0) {
      loadReplies();
    }
  }, [post.id]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${post.id}/replies`);
      if (!response.ok) throw new Error('Failed to load replies');
      const data = await response.json();
      setReplies(data.replies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (content: string) => {
    try {
      setIsSubmittingReply(true);
      setError(null);

      const response = await fetch(`/api/posts/${post.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const newReply = await response.json();
      setReplies((prev) => [...prev, newReply]);
      setShowReplyComposer(false);
      onReplySubmitted?.(newReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
      throw err;
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const response = await fetch(`/api/posts/${replyId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete reply');
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reply');
    }
  };

  const handleFlagReply = async (replyId: string, reason: string) => {
    try {
      const response = await fetch(`/api/posts/${replyId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to flag reply');
      // Show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag reply');
    }
  };

  const handlePostDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete post');
      onPostDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  return (
    <div className="space-y-6">
      {/* Original Post */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-semibold text-gray-100">{authorName}</span>
              <AuthorBadge role={authorRole} />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.updated_at !== post.created_at && (
                <span className="text-xs text-gray-600 italic">(edited)</span>
              )}
            </div>

            <PostContent content={post.content} />

            {post.is_update && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-700/50">
                <span>📢</span>
                Update
              </div>
            )}
          </div>

          {(isPostAuthor || authorRole === 'parent') && (
            <PostActions
              postId={post.id}
              isAuthor={isPostAuthor}
              isModerator={authorRole === 'parent'}
              onReplyClick={() => setShowReplyComposer(!showReplyComposer)}
              onDelete={handlePostDelete}
              replyCount={replies.length}
            />
          )}
        </div>
      </div>

      {/* Replies Section */}
      {replies.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-gray-300">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </div>
          {replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              familyId={familyId}
              onDelete={handleDeleteReply}
              onFlag={handleFlagReply}
            />
          ))}
        </div>
      )}

      {/* Reply Composer */}
      {showReplyComposer && (
        <div className="mt-6">
          <ReplyComposer
            onSubmit={handleReplySubmit}
            onCancel={() => setShowReplyComposer(false)}
            loading={isSubmittingReply}
            autoFocus
          />
        </div>
      )}

      {!showReplyComposer && (
        <button
          onClick={() => setShowReplyComposer(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0 0l6-6"
            />
          </svg>
          Reply to Thread
        </button>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
