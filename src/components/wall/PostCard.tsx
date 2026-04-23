'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Post } from '@/types/posts';
import { formatTimeAgo, formatFullDate } from '@/lib/formatters';
import { AuthorBadge } from './AuthorBadge';
import { PostContent } from './PostContent';
import { PostActions } from './PostActions';

interface PostCardProps {
  post: Post;
  authorEmail: string;
  authorRole: 'parent' | 'child' | 'admin';
  isAuthor: boolean;
  isModerator: boolean;
  replyCount?: number;
  onReplyClick?: () => void;
  onFlagSuccess?: () => void;
  onDelete?: (postId: string) => Promise<void>;
  onFlag?: (postId: string, reason: string) => Promise<void>;
}

const PostCardComponent = ({
  post,
  authorEmail,
  authorRole,
  isAuthor,
  isModerator,
  replyCount = 0,
  onReplyClick,
  onFlagSuccess,
  onDelete,
  onFlag,
}: PostCardProps) => {
  const authorName = authorEmail.split('@')[0];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-4 hover:border-gray-600 transition-colors">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{authorName}</h3>
            <AuthorBadge role={authorRole} />
          </div>
          <div className="text-sm text-gray-400" title={formatFullDate(post.created_at)}>
            {formatTimeAgo(post.created_at)}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2">
          {post.flagged && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-700/30">
              Flagged
            </span>
          )}
          {post.is_update && (
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700/30">
              Update
            </span>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <PostContent content={post.content} maxLength={500} />
      </div>

      {/* Post Actions */}
      <PostActions
        postId={post.id}
        authorId={post.author_id}
        isAuthor={isAuthor}
        isModerator={isModerator}
        replyCount={replyCount}
        onReplyClick={onReplyClick}
        onFlagSuccess={onFlagSuccess}
        onDelete={onDelete}
        onFlag={onFlag}
      />

      {/* Reply Button - Link to thread */}
      {replyCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Link
            href={`/wall/${post.id}`}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0 0l6-6"
              />
            </svg>
            View {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
          </Link>
        </div>
      )}
    </div>
  );
};

export const PostCard = memo(PostCardComponent);
