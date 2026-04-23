'use client';

import { useState } from 'react';

interface DeletePostModalProps {
  postId: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const DELETE_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'offtopic', label: 'Off-topic' },
  { value: 'rule_violation', label: 'Rule Violation' },
  { value: 'other', label: 'Other' },
];

export function DeletePostModal({
  postId,
  content,
  onConfirm,
  onCancel,
  isOpen,
}: DeletePostModalProps) {
  const [reason, setReason] = useState<string>('');
  const [reasonText, setReasonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a deletion reason');
      return;
    }

    if (reason === 'other' && !reasonText.trim()) {
      setError('Please provide an explanation for "Other"');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason,
          reason_text: reasonText.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete post');
      }

      setReason('');
      setReasonText('');
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
    setError(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-white mb-4">Delete Post</h3>

        {/* Post Preview */}
        <div className="bg-gray-700 rounded p-3 mb-4 max-h-24 overflow-hidden">
          <p className="text-sm text-gray-300 line-clamp-4">{content}</p>
        </div>

        {/* Warning */}
        <div className="bg-red-900/20 border border-red-700/30 rounded p-3 mb-4">
          <p className="text-sm text-red-200">
            ⚠️ This action is permanent. The post will be deleted and cannot be recovered.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reason Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deletion Reason
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value !== 'other') {
                  setReasonText('');
                }
              }}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a reason...</option>
              {DELETE_REASONS.map((r) => (
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
                placeholder="Explain why this post is being deleted..."
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">
                {reasonText.length}/500 characters
              </p>
            </div>
          )}

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
              className="flex-1 px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
