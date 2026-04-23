'use client';

import { useState } from 'react';
import { FlaggedPostData, FlagStatus } from '@/types/moderation';

interface FlaggedPostCardProps {
  post: FlaggedPostData;
  onStatusChange?: (flagId: string, status: FlagStatus) => void;
  onHidePost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

export function FlaggedPostCard({
  post,
  onStatusChange,
  onHidePost,
  onDeletePost,
}: FlaggedPostCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleStatusChange = async (flagId: string, status: FlagStatus) => {
    setActionLoading(true);
    try {
      if (onStatusChange) {
        await onStatusChange(flagId, status);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleHidePost = async () => {
    setActionLoading(true);
    try {
      if (onHidePost) {
        await onHidePost(post.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setActionLoading(true);
      try {
        if (onDeletePost) {
          await onDeletePost(post.id);
        }
      } finally {
        setActionLoading(false);
      }
    }
  };

  const contentPreview = post.content.length > 200 
    ? post.content.substring(0, 200) + '...' 
    : post.content;

  const getStatusBadge = (status: FlagStatus) => {
    const statusConfig: Record<FlagStatus, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'bg-red-900/30', text: 'text-red-300', icon: '⏳' },
      reviewed: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', icon: '👀' },
      dismissed: { bg: 'bg-green-900/30', text: 'text-green-300', icon: '✓' },
    };

    const config = statusConfig[status];
    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded text-xs font-medium`}>
        {config.icon} {status}
      </span>
    );
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">
            Post ID: <code className="bg-gray-900 px-2 py-1 rounded text-xs">{post.id.slice(0, 8)}</code>
          </p>
          <p className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-red-400 mb-2">🚩 {post.flag_count}</div>
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={actionLoading}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50"
          >
            {showActions ? 'Hide' : 'Show'} Actions
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4 p-4 bg-gray-900/50 border border-gray-700 rounded">
        <p className="text-gray-300 text-sm leading-relaxed">{contentPreview}</p>
      </div>

      {/* Flags List */}
      <div className="mb-4 space-y-3 bg-gray-900/30 p-4 rounded border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Flags ({post.flags?.length || 0})</h3>
        {post.flags && post.flags.length > 0 ? (
          post.flags.map((flag) => (
            <div key={flag.id} className="flex items-start justify-between bg-gray-800 p-3 rounded">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">
                  <strong>Reason:</strong> {flag.reason}
                </p>
                <p className="text-xs text-gray-500">
                  Reporter: Community • {new Date(flag.created_at).toLocaleString()}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                {getStatusBadge(flag.status)}
                {showActions && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStatusChange(flag.id, 'reviewed')}
                      disabled={actionLoading || flag.status === 'reviewed'}
                      className="text-xs px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-white disabled:opacity-50"
                      title="Mark as reviewed"
                    >
                      👀
                    </button>
                    <button
                      onClick={() => handleStatusChange(flag.id, 'dismissed')}
                      disabled={actionLoading || flag.status === 'dismissed'}
                      className="text-xs px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-white disabled:opacity-50"
                      title="Dismiss flag"
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">No flags</p>
        )}
      </div>

      {/* Post Status */}
      <div className="mb-4 flex gap-2 text-xs">
        {post.hidden && (
          <span className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded">🙈 Hidden</span>
        )}
        {post.flagged && (
          <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded">🚩 Flagged</span>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 border-t border-gray-700 pt-4">
          <button
            onClick={handleHidePost}
            disabled={actionLoading || post.hidden}
            className="flex-1 px-3 py-2 bg-orange-700 hover:bg-orange-600 rounded text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            🙈 Hide Post
          </button>
          <button
            onClick={handleDeletePost}
            disabled={actionLoading}
            className="flex-1 px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            🗑️ Delete Post
          </button>
        </div>
      )}
    </div>
  );
}
