'use client';

import { useState } from 'react';
import { SuspensionData } from '@/types/suspension';

interface SuspensionIndicatorProps {
  userId: string;
  suspension: SuspensionData;
  onUnsuspend?: () => void;
}

export function SuspensionIndicator({
  userId,
  suspension,
  onUnsuspend,
}: SuspensionIndicatorProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleUnsuspend = async () => {
    if (
      !window.confirm(
        'Are you sure you want to lift the suspension for this user?'
      )
    ) {
      return;
    }

    setIsRemoving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unsuspend user');
      }

      if (onUnsuspend) {
        onUnsuspend();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend user');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!suspension.suspended) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">User Suspended</h3>

            <div className="mt-2 text-sm text-red-700 space-y-1">
              <p>
                <span className="font-semibold">Reason:</span>{' '}
                {suspension.suspension_reason?.replace(/_/g, ' ')}
              </p>

              {suspension.suspension_reason_text && (
                <p>
                  <span className="font-semibold">Details:</span>{' '}
                  {suspension.suspension_reason_text}
                </p>
              )}

              <p>
                <span className="font-semibold">Suspended:</span>{' '}
                {formatDate(suspension.suspended_at)}
              </p>

              {suspension.suspension_expires_at ? (
                <p>
                  <span className="font-semibold">Expires:</span>{' '}
                  {formatDate(suspension.suspension_expires_at)}
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Duration:</span> Permanent
                </p>
              )}

              {suspension.appeal_status && suspension.appeal_status !== 'none' && (
                <p>
                  <span className="font-semibold">Appeal Status:</span>{' '}
                  <span
                    className={
                      suspension.appeal_status === 'pending'
                        ? 'text-yellow-700'
                        : suspension.appeal_status === 'approved'
                          ? 'text-green-700'
                          : 'text-red-700'
                    }
                  >
                    {suspension.appeal_status.charAt(0).toUpperCase() +
                      suspension.appeal_status.slice(1)}
                  </span>
                </p>
              )}
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{error}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleUnsuspend}
          disabled={isRemoving}
          className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-semibold px-3 py-1 rounded transition duration-200"
        >
          {isRemoving ? 'Removing...' : 'Lift Suspension'}
        </button>
      </div>
    </div>
  );
}
