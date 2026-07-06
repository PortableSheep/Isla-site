'use client';

import { useEffect, useState, useCallback } from 'react';
import { SuspensionAppeal } from '@/types/suspension';

interface AppealsQueueProps {
  onCountChange?: (count: number) => void;
}

export function AppealsQueue({ onCountChange }: AppealsQueueProps) {
  const [appeals, setAppeals] = useState<SuspensionAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewResponse, setReviewResponse] = useState<Record<string, string>>({});

  const fetchAppeals = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/admin/appeals');
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail =
          typeof body?.error === 'string'
            ? body.error
            : typeof body?.detail === 'string'
            ? body.detail
            : `Failed (${response.status})`;
        throw new Error(detail);
      }

      const data = await response.json();
      const nextAppeals = data.appeals || [];
      setAppeals(nextAppeals);
      onCountChange?.(nextAppeals.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      onCountChange?.(0);
      console.error('Error fetching appeals:', err);
    }
  }, [onCountChange]);

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
        const body = await response.json().catch(() => null);
        const detail =
          typeof body?.error === 'string'
            ? body.error
            : typeof body?.detail === 'string'
            ? body.detail
            : `Failed (${response.status})`;
        throw new Error(detail);
      }

      // Remove from list
      setAppeals((prev) => {
        const next = prev.filter((a) => a.id !== appealId);
        onCountChange?.(next.length);
        return next;
      });
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
        const body = await res.json().catch(() => null);
        const detail =
          typeof body?.error === 'string'
            ? body.error
            : typeof body?.detail === 'string'
            ? body.detail
            : `Failed (${res.status})`;
        throw new Error(detail);
      }

      // Remove from list
      setAppeals((prev) => {
        const next = prev.filter((a) => a.id !== appealId);
        onCountChange?.(next.length);
        return next;
      });
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
    return null;
  }

  if (error) {
    return (
      <li className="overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
      </li>
    );
  }

  if (appeals.length === 0) {
    return null;
  }

  return (
    <>
      {appeals.map((appeal) => (
        <li
          key={appeal.id}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold uppercase text-slate-200">
              appeal
            </span>
            <span className="font-medium text-slate-100">
              User {appeal.user_id.slice(0, 8)}...
            </span>
            <span>·</span>
            <span>{new Date(appeal.created_at).toLocaleDateString()}</span>
            <span className="rounded-full border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              pending
            </span>
          </div>
          <div className="mt-3">
            <div className="rounded border border-white/10 bg-black/20 p-3">
              <p className="text-sm whitespace-pre-wrap break-words text-slate-200">
                {appeal.appeal_text}
              </p>
            </div>
          </div>
          <textarea
            value={reviewResponse[appeal.id] || ''}
            onChange={(e) =>
              setReviewResponse((prev) => ({
                ...prev,
                [appeal.id]: e.target.value,
              }))
            }
            placeholder="Rejection reason required"
            maxLength={500}
            className="mt-3 w-full resize-none rounded border border-white/15 bg-black/20 px-3 py-2 text-xs text-slate-100"
            rows={2}
          />
          <p className="mt-1 text-xs text-slate-500">
            {(reviewResponse[appeal.id] || '').length} / 500 characters
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => handleApprove(appeal.id)}
              className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/30"
            >
              Approve Appeal
            </button>
            <button
              onClick={() => handleReject(appeal.id)}
              disabled={!reviewResponse[appeal.id] || reviewResponse[appeal.id].trim().length === 0}
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject Appeal
            </button>
          </div>
        </li>
      ))}
    </>
  );
}
