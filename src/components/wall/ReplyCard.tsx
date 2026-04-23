'use client';

import { Post } from '@/types/posts';
import { AuthorBadge } from './AuthorBadge';
import { PostActions } from './PostActions';
import { formatDistanceToNow } from 'date-fns';

interface ReplyCardProps {
  reply: Post & { author?: { name?: string; email?: string; role?: 'parent' | 'child' | 'admin' } };
  currentUserId: string;
  familyId: string;
  onDelete?: (replyId: string) => Promise<void>;
  onFlag?: (replyId: string, reason: string) => Promise<void>;
}

export function ReplyCard({
  reply,
  currentUserId,
  familyId,
  onDelete,
  onFlag,
}: ReplyCardProps) {
  const isAuthor = reply.author_id === currentUserId;
  const authorRole = reply.author?.role || 'child';
  const authorName = reply.author?.name || 'Unknown';

  return (
    <div className="border-l-2 border-slate-600 pl-4 py-3 hover:border-slate-500 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-200">{authorName}</span>
            <AuthorBadge role={authorRole} />
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
            </span>
            {reply.updated_at !== reply.created_at && (
              <span className="text-xs text-gray-600 italic">(edited)</span>
            )}
          </div>

          <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
        </div>

        {(isAuthor || authorRole === 'parent') && (
          <PostActions
            postId={reply.id}
            isAuthor={isAuthor}
            isModerator={authorRole === 'parent'}
            onDelete={onDelete}
            onFlag={onFlag}
          />
        )}
      </div>
    </div>
  );
}
