'use client';

import { useState } from 'react';

interface HidePostModalProps {
  postId: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const HIDE_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'offtopic', label: 'Off-topic' },
  { value: 'rule_violation', label: 'Rule Violation' },
  { value: 'other', label: 'Other' },
];

export function HidePostModal({
  postId,
  content,
  onConfirm,
  onCancel,
  isOpen,
}: HidePostModalProps) {
  const [reason, setReason] = useState<string>('');
  const [reasonText, setReasonText] = useState<string>('');
  const [notifyAuthor, setNotifyAuthor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a hide reason');
      return;
    }

    if (reason === 'other' && !reasonText.trim()) {
      setError('Please provide an explanation for "Other"');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hidden: true,
          reason: reason,
          reason_text: reasonText.trim() || null,
          notify_author: notifyAuthor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to hide post');
      }

      setReason('');
      setReasonText('');
      setNotifyAuthor(true);
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setReasonText('');
    setNotifyAuthor(true);
    setError(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Hide Post</h3>

        {/* Post Preview */}
        <div className="bg-gray-700 rounded p-3 mb-4 max-h-24 overflow-hidden">
          <p className="text-sm text-gray-300 line-clamp-4">{content}</p>
        </div>

        {/* Info */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded p-3 mb-4">
          <p className="text-sm text-amber-200">
            ℹ️ Hidden posts won't appear in the wall but aren't permanently deleted. Authors can still see their own hidden posts.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reason Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hide Reason
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value !== 'other') {
                  setReasonText('');
                }
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select a reason...</option>
              {HIDE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Text Input (for "Other") */}
          {reason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Please explain
              </label>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value.slice(0, 500))}
                placeholder="Explain why this post is being hidden..."
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">
                {reasonText.length}/500 characters
              </p>
            </div>
          )}

          {/* Notify Author */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="notifyAuthor"
              checked={notifyAuthor}
              onChange={(e) => setNotifyAuthor(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 cursor-pointer"
            />
            <label htmlFor="notifyAuthor" className="ml-2 text-sm text-gray-300 cursor-pointer">
              Notify author about the hide
            </label>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason}
              className="flex-1 px-3 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Hiding...' : 'Hide Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
