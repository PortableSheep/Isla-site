'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface PendingItem {
  id: string;
  author_id: string;
  content: string;
  parent_post_id: string | null;
  created_at: string;
  kind: 'post' | 'comment';
  author: { name?: string; email?: string; role?: string } | null;
}

export default function WallModerationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/moderation');
      if (res.status === 403) {
        setForbidden(true);
        setItems([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.error || 'Failed to load');
      }
      const data = await res.json();
      setItems(data.pending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: string) => {
    setWorking(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Approve failed');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed');
    } finally {
      setWorking(null);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Optional reason for rejection:');
    if (reason === null) return;
    setWorking(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Reject failed');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setWorking(null);
    }
  };

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8 text-center">
          <h1 className="text-lg font-semibold text-red-200 mb-2">Admins only</h1>
          <p className="text-gray-400">
            This page is only available to the wall admin.
          </p>
          <Link href="/wall" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
            Back to wall →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold iz-gradient-text">Wall moderation</h1>
          <p className="text-slate-400 mt-1">
            Approve or reject pending posts and comments. Approved items become
            visible to everyone on the wall.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="iz-btn-ghost px-4 py-2 text-sm"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}

      {!loading && items.length === 0 && (
        <div className="iz-card p-10 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-slate-300">Nothing to moderate right now.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="iz-card p-5 border border-gray-700">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="px-2 py-0.5 rounded bg-gray-800 uppercase tracking-wide">
                {item.kind}
              </span>
              <span>
                {item.author?.name || item.author?.email || 'Unknown author'}
                {item.author?.role ? ` · ${item.author.role}` : ''}
              </span>
              <span>
                · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-white whitespace-pre-wrap mb-4">{item.content}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approve(item.id)}
                disabled={working === item.id}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {working === item.id ? '…' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => reject(item.id)}
                disabled={working === item.id}
                className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
