'use client';

import { useState } from 'react';
import { SuspensionReason } from '@/types/suspension';

interface SuspendUserModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SUSPENSION_REASONS: { value: SuspensionReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'multiple_violations', label: 'Multiple Violations' },
  { value: 'other', label: 'Other' },
];

const DURATION_OPTIONS = [
  { value: 1, label: '24 Hours' },
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: null, label: 'Permanent' },
];

export function SuspendUserModal({
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess,
}: SuspendUserModalProps) {
  const [reason, setReason] = useState<SuspensionReason>('spam');
  const [reasonText, setReasonText] = useState('');
  const [durationDays, setDurationDays] = useState<number | null>(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason === 'other' && !reasonText.trim()) {
      setError('Please provide a reason for "Other"');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          reason_text: reasonText || undefined,
          duration_days: durationDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to suspend user');
      }

      // Reset form and close
      setReason('spam');
      setReasonText('');
      setDurationDays(7);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Suspend User</h2>

        <p className="text-gray-600 mb-6">
          Suspending <span className="font-semibold">{userName}</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Suspension Reason *
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as SuspensionReason);
                if (e.target.value !== 'other') {
                  setReasonText('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SUSPENSION_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Text for "Other" */}
          {reason === 'other' && (
            <div>
              <label
                htmlFor="reasonText"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Reason Details *
              </label>
              <textarea
                id="reasonText"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Describe the reason for suspension..."
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reasonText.length} / 500 characters
              </p>
            </div>
          )}

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Suspension Duration *
            </label>
            <select
              id="duration"
              value={durationDays ?? 'permanent'}
              onChange={(e) => {
                setDurationDays(
                  e.target.value === 'permanent' ? null : Number(e.target.value)
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value ?? 'permanent'} value={opt.value ?? 'permanent'}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {isSubmitting ? 'Suspending...' : 'Suspend User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
