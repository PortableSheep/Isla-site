'use client';

import { useCallback, useEffect, useState } from 'react';

type PostReviewRequest = {
  id: string;
  post_id: string;
  request_message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  created_at: string;
  posts?: {
    id: string;
    content: string;
    author_name: string | null;
    moderation_status: string;
    created_at: string;
  };
};

interface PostReviewRequestsQueueProps {
  onCountChange?: (count: number) => void;
}

export function PostReviewRequestsQueue({ onCountChange }: PostReviewRequestsQueueProps) {
  const [items, setItems] = useState<PostReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/post-review-requests', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
        const detail = body?.detail || body?.error || `Failed (${res.status})`;
        throw new Error(detail);
      }
      const body = (await res.json()) as { requests?: PostReviewRequest[] };
      const requests = body.requests ?? [];
      setItems(requests);
      onCountChange?.(requests.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load post review requests';
      if (message.includes('post_review_requests') || message.includes('relation')) {
        setError('Post review requests are unavailable until the latest database migration is applied.');
        onCountChange?.(0);
        return;
      }
      setError(message);
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/post-review-requests/${id}/approve`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
    }
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      onCountChange?.(next.length);
      return next;
    });
  };

  const reject = async (id: string) => {
    const review_response = (responses[id] ?? '').trim();
    if (!review_response) throw new Error('Please add a rejection reason');
    const res = await fetch(`/api/admin/post-review-requests/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ review_response }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
    }
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      onCountChange?.(next.length);
      return next;
    });
    setResponses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  if (loading || (!error && items.length === 0)) return null;

  if (error) {
    return (
      <li className="overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
      </li>
    );
  }

  return (
    <>
      {items.map((item) => (
        <li
          key={item.id}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold uppercase text-slate-200">
              review request
            </span>
            <span className="font-medium text-slate-100">
              {item.posts?.author_name || 'Anonymous'}
            </span>
            <span>·</span>
            <span>{new Date(item.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-all text-[14px] text-slate-100">
            {item.posts?.content || '[post unavailable]'}
          </p>
          {item.request_message ? (
            <p className="mt-3 rounded bg-white/5 px-2 py-1 text-xs text-slate-300">
              Request: {item.request_message}
            </p>
          ) : null}
          <textarea
            value={responses[item.id] ?? ''}
            onChange={(e) =>
              setResponses((prev) => ({ ...prev, [item.id]: e.target.value }))
            }
            placeholder="Rejection reason required"
            maxLength={500}
            className="mt-3 w-full rounded border border-white/15 bg-black/20 px-3 py-2 text-xs text-white"
            rows={2}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => void approve(item.id)}
              className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/30"
            >
              Approve & Re-open
            </button>
            <button
              onClick={() =>
                void reject(item.id).catch((err) =>
                  alert(err instanceof Error ? err.message : 'Reject failed')
                )
              }
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/30"
            >
              Reject Request
            </button>
          </div>
        </li>
      ))}
    </>
  );
}
