'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { flagPost } from '@/lib/posts';

interface PostActionsProps {
  postId: string;
  isAuthor: boolean;
  isModerator: boolean;
  onReplyClick?: () => void;
  onFlagSuccess?: () => void;
  replyCount?: number;
}

export function PostActions({
  postId,
  isAuthor,
  isModerator,
  onReplyClick,
  onFlagSuccess,
  replyCount = 0,
}: PostActionsProps) {
  const { user } = useAuth();
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim()) {
      setError('Please provide a reason');
      return;
    }

    if (!user) {
      setError('You must be logged in to flag a post');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await flagPost(postId, flagReason.trim(), user.id);
      setFlagModalOpen(false);
      setFlagReason('');
      onFlagSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700">
        {replyCount > 0 && (
          <span className="text-xs text-gray-400">
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </span>
        )}

        <div className="flex-1" />

        {onReplyClick && (
          <button
            onClick={onReplyClick}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0 0l6-6"
              />
            </svg>
            Reply
          </button>
        )}

        <button
          onClick={() => setFlagModalOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4a6 6 0 016-6h4a6 6 0 016 6v4M9 20h6" />
          </svg>
          Flag
        </button>

        {isModerator && (
          <button
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Hide
          </button>
        )}
      </div>

      {flagModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Flag Post</h3>

            <form onSubmit={handleFlagSubmit}>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Why are you flagging this post?"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                rows={4}
              />

              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFlagModalOpen(false);
                    setFlagReason('');
                    setError(null);
                  }}
                  className="flex-1 px-3 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
