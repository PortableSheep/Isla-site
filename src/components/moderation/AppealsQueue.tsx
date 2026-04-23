'use client';

import { useEffect, useState, useCallback } from 'react';
import { SuspensionAppeal } from '@/types/suspension';

export function AppealsQueue() {
  const [appeals, setAppeals] = useState<SuspensionAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewResponse, setReviewResponse] = useState<Record<string, string>>({});

  const fetchAppeals = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/admin/appeals');
      if (!response.ok) {
        throw new Error('Failed to fetch appeals');
      }

      const data = await response.json();
      setAppeals(data.appeals || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching appeals:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchAppeals();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAppeals, 30000);
    return () => clearInterval(interval);
  }, [fetchAppeals]);

  const handleApprove = async (appealId: string) => {
    if (!window.confirm('Are you sure you want to approve this appeal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/appeals/${appealId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve appeal');
      }

      // Remove from list
      setAppeals(appeals.filter((a) => a.id !== appealId));
    } catch (err) {
      console.error('Error approving appeal:', err);
      alert('Failed to approve appeal');
    }
  };

  const handleReject = async (appealId: string) => {
    const response = reviewResponse[appealId];

    if (!response || response.trim().length === 0) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this appeal?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/appeals/${appealId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_response: response }),
      });

      if (!res.ok) {
        throw new Error('Failed to reject appeal');
      }

      // Remove from list
      setAppeals(appeals.filter((a) => a.id !== appealId));
      setReviewResponse((prev) => {
        const next = { ...prev };
        delete next[appealId];
        return next;
      });
    } catch (err) {
      console.error('Error rejecting appeal:', err);
      alert('Failed to reject appeal');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Loading appeals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No pending appeals to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appeals.map((appeal) => (
        <div
          key={appeal.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          <div
            className="p-4 cursor-pointer hover:bg-gray-50 transition"
            onClick={() =>
              setExpandedId(expandedId === appeal.id ? null : appeal.id)
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Appeal from {appeal.user_id.slice(0, 8)}...
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted {new Date(appeal.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="ml-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
            </div>
          </div>

          {expandedId === appeal.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Appeal Text:</h4>
                <div className="bg-white rounded p-3 border border-gray-200">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                    {appeal.appeal_text}
                  </p>
                </div>
              </div>

              {expandedId === appeal.id &&
                !reviewResponse[appeal.id] &&
                (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rejection Reason (if rejecting):
                    </label>
                    <textarea
                      value={reviewResponse[appeal.id] || ''}
                      onChange={(e) =>
                        setReviewResponse((prev) => ({
                          ...prev,
                          [appeal.id]: e.target.value,
                        }))
                      }
                      placeholder="Provide a reason if you reject this appeal..."
                      maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(reviewResponse[appeal.id] || '').length} / 500 characters
                    </p>
                  </div>
                )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(appeal.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Approve Appeal
                </button>

                <button
                  onClick={() => handleReject(appeal.id)}
                  disabled={!reviewResponse[appeal.id] || reviewResponse[appeal.id].trim().length === 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Reject Appeal
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
