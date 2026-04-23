'use client';

import { memo } from 'react';
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
        isAuthor={isAuthor}
        isModerator={isModerator}
        replyCount={replyCount}
        onReplyClick={post.is_update ? undefined : onReplyClick}
        onFlagSuccess={onFlagSuccess}
      />
    </div>
  );
};

export const PostCard = memo(PostCardComponent);
