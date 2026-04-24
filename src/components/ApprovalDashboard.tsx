'use client';

import React, { useState, useEffect } from 'react';
import { PendingChildCard } from './PendingChildCard';

interface ChildProfile {
  id: string;
  user_id: string;
  family_id: string;
  status: string;
  created_at: string;
}

interface FamilyStats {
  familyId: string;
  familyName: string;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function ApprovalDashboard() {
  const [pending, setPending] = React.useState<ChildProfile[]>([]);
  const [stats, setStats] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/approvals/pending');

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to fetch pending approvals (${response.status})`
        );
      }

      const data = await response.json();
      setPending(data.pending || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionComplete = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin text-blue-400">⏳</div>
        <p className="text-gray-400 mt-2">Loading approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
        <p>Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
        <div className="text-4xl mb-2">✓</div>
        <p className="text-gray-400">No pending approvals</p>
        <p className="text-gray-500 text-sm mt-1">All children are approved or rejected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Pending Approvals ({pending.length})
        </h2>
        
        {stats && Array.isArray(stats) && stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((family: FamilyStats) => (
              <div
                key={family.familyId}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <h3 className="text-sm font-semibold text-gray-400 uppercase">
                  {family.familyName}
                </h3>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-400">Pending:</span>
                    <span className="font-semibold">{family.stats.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Approved:</span>
                    <span className="font-semibold">{family.stats.approved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Rejected:</span>
                    <span className="font-semibold">{family.stats.rejected}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.map((child) => {
            const family = stats.find((s: FamilyStats) => s.familyId === child.family_id);
            return (
              <PendingChildCard
                key={child.id}
                childId={child.user_id}
                childEmail={child.user_id}
                familyId={child.family_id}
                familyName={family?.familyName || 'Unknown Family'}
                createdAt={child.created_at}
                onActionComplete={handleActionComplete}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
