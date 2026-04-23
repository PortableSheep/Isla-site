'use client';

import { memo } from 'react';
import { Post } from '@/types/posts';
import { formatTimeAgo, formatFullDate } from '@/lib/formatters';

interface UpdateCardProps {
  update: Post;
  isAuthor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const UpdateCardComponent = ({
  update,
  isAuthor = false,
  onEdit,
  onDelete,
}: UpdateCardProps) => {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border-2 border-amber-600/50 bg-gradient-to-br from-amber-950/40 to-amber-900/20 shadow-lg hover:border-amber-500/70 transition-all">
      {/* Update Banner Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-sm font-bold tracking-wide">
              📢 UPDATE
            </span>
            <span className="text-amber-100 text-sm font-medium">from Isla</span>
          </div>
          <div className="text-xs text-amber-100 opacity-80" title={formatFullDate(update.created_at)}>
            {formatTimeAgo(update.created_at)}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-5">
        <p className="text-white text-lg leading-relaxed whitespace-pre-wrap break-words">
          {update.content}
        </p>

        {/* Timestamp and metadata */}
        <div className="mt-4 pt-4 border-t border-amber-700/30 flex items-center justify-between text-xs text-amber-200/70">
          <div>
            {update.updated_at !== update.created_at && (
              <span>Edited {formatTimeAgo(update.updated_at)}</span>
            )}
          </div>
          {isAuthor && (onEdit || onDelete) && (
            <div className="flex gap-3">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="text-amber-300 hover:text-amber-200 transition-colors font-medium"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flagged indicator */}
      {update.flagged && (
        <div className="px-6 py-2 bg-orange-900/40 border-t border-orange-700/50 text-orange-300 text-xs font-medium">
          🚩 Flagged for moderation
        </div>
      )}
    </div>
  );
};

export const UpdateCard = memo(UpdateCardComponent);
