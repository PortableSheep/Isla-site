'use client';

import React, { useState, useEffect } from 'react';

interface ApprovalRecord {
  id: string;
  child_id: string;
  action: 'approved' | 'rejected';
  reason?: string;
  created_at: string;
}

interface ApprovalHistoryProps {
  familyId: string;
}

export function ApprovalHistory({ familyId }: ApprovalHistoryProps) {
  const [history, setHistory] = React.useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ familyId });
        if (filter !== 'all') {
          params.append('action', filter);
        }

        const response = await fetch(`/api/approvals/history?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [familyId, filter]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
        Error: {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-800/50 border border-gray-700 rounded-lg">
        <p className="text-gray-400">No approval history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Rejected
        </button>
      </div>

      <div className="space-y-3">
        {history.map((record) => {
          const date = new Date(record.created_at);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={record.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-4"
            >
              <div
                className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  record.action === 'approved' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-semibold ${
                      record.action === 'approved'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {record.action === 'approved' ? '✓' : '✕'}{' '}
                    {record.action.charAt(0).toUpperCase() + record.action.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">{record.child_id}</span>
                </div>

                {record.reason && (
                  <p className="text-sm text-gray-400 mb-2">Reason: {record.reason}</p>
                )}

                <p className="text-xs text-gray-500">{formattedDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
