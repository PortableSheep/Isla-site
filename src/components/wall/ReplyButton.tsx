'use client';

import Link from 'next/link';

interface ReplyButtonProps {
  postId: string;
  replyCount?: number;
  variant?: 'inline' | 'block';
}

export function ReplyButton({
  postId,
  replyCount = 0,
  variant = 'inline',
}: ReplyButtonProps) {
  if (variant === 'block') {
    return (
      <Link
        href={`/wall/${postId}`}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0 0l6-6"
          />
        </svg>
        View Thread ({replyCount})
      </Link>
    );
  }

  return (
    <Link
      href={`/wall/${postId}`}
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
      {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
    </Link>
  );
}
