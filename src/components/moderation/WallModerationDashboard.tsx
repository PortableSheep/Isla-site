'use client';

import { useCallback, useEffect, useState } from 'react';

type ModItem = {
  id: string;
  parent_post_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_cookie_id: string | null;
  content: string;
  created_at: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  spam_score: number | null;
  spam_reasons: string[] | null;
  client_ip: string | null;
  kind: 'post' | 'comment';
  author: { name?: string; email?: string; role?: string } | null;
};

type Status = 'pending' | 'approved' | 'rejected';

const TAB_LABELS: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function SpamTag({ score, reasons }: { score: number | null; reasons: string[] | null }) {
  if (score == null || score <= 0) return null;
  const color =
    score >= 6
      ? 'bg-rose-500/15 text-rose-300 border-rose-400/30'
      : score >= 3
      ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
      : 'bg-slate-500/15 text-slate-300 border-slate-400/20';
  return (
    <span
      title={reasons?.join(', ') || ''}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${color}`}
    >
      Spam {score}
    </span>
  );
}

export function WallModerationDashboard() {
  const [tab, setTab] = useState<Status>('pending');
  const [items, setItems] = useState<ModItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status: Status) => {
    setItems(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation?status=${status}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Load failed (${res.status})`);
      const json = await res.json();
      setItems((json.items ?? json.pending ?? []) as ModItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const act = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      setBusy(id + ':' + action);
      try {
        const url = `/api/admin/moderation/${id}/${action}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
        }
        setItems((prev) => prev?.filter((x) => x.id !== id) ?? null);
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Action failed');
      } finally {
        setBusy(null);
      }
    },
    []
  );

  const banIp = useCallback(
    async (postId: string) => {
      if (!confirm('Ban the IP behind this post? They will not be able to post again.')) return;
      setBusy(postId + ':ban');
      try {
        const res = await fetch(`/api/admin/ip-bans/from-post/${postId}`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
        }
        alert('IP banned.');
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Ban failed');
      } finally {
        setBusy(null);
      }
    },
    []
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="iz-gradient-text text-2xl font-bold">Moderation</h1>
          <p className="text-sm text-slate-400">
            Approve or reject posts and comments, or ban an IP.
          </p>
        </div>
        <button
          onClick={() => load(tab)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:border-white/25"
        >
          Refresh
        </button>
      </header>

      <div className="flex gap-2 border-b border-white/5">
        {(Object.keys(TAB_LABELS) as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-2 text-sm transition ${
              tab === s
                ? 'border-b-2 border-fuchsia-400 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {TAB_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {items === null && !error && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
        </div>
      )}

      {items && items.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">
          Nothing {tab} right now. 🎉
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items?.map((it) => (
          <li
            key={it.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold uppercase text-slate-200">
                {it.kind}
              </span>
              <span className="font-medium text-slate-100">
                {it.author_name || it.author?.name || it.author?.email || 'Anonymous'}
              </span>
              <span>·</span>
              <span>{fmt(it.created_at)}</span>
              <SpamTag score={it.spam_score} reasons={it.spam_reasons} />
              {it.client_ip && (
                <span className="ml-auto font-mono text-[11px] text-slate-500">
                  {it.client_ip}
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[14px] text-slate-100">{it.content}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {it.moderation_status !== 'approved' && (
                <button
                  disabled={busy?.startsWith(it.id)}
                  onClick={() => act(it.id, 'approve')}
                  className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Approve
                </button>
              )}
              {it.moderation_status !== 'rejected' && (
                <button
                  disabled={busy?.startsWith(it.id)}
                  onClick={() => act(it.id, 'reject')}
                  className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
                >
                  Reject
                </button>
              )}
              {it.client_ip && (
                <button
                  disabled={busy?.startsWith(it.id)}
                  onClick={() => banIp(it.id)}
                  className="ml-auto rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                >
                  Ban IP
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
