'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Ban = {
  id: string;
  cidr: string;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
};

export default function BansPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bans, setBans] = useState<Ban[]>([]);
  const [form, setForm] = useState({ cidr: '', reason: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      if (!user) return;
      const { data } = await supabase.rpc('is_admin', { uid: user.id });
      setIsAdmin(Boolean(data));
      setChecking(false);
    }
    if (!loading) check();
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/ip-bans', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return;
    const json = await res.json();
    setBans(json.bans ?? []);
  }, []);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  if (loading || checking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-slate-300">
        <h1 className="text-2xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-slate-400">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold">IP Bans</h1>
      <p className="mt-1 text-sm text-slate-400">
        Block posting by IP range. Uses CIDR notation (e.g. 1.2.3.4/32 or 10.0.0.0/24).
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.cidr.trim() || busy) return;
          setBusy(true);
          setErr(null);
          try {
            const res = await fetch('/api/admin/ip-bans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ cidr: form.cidr.trim(), reason: form.reason || null }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body?.detail || body?.error || 'Failed');
            }
            setForm({ cidr: '', reason: '' });
            await refresh();
          } catch (error) {
            setErr(error instanceof Error ? error.message : 'Failed');
          } finally {
            setBusy(false);
          }
        }}
        className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={form.cidr}
            onChange={(e) => setForm((f) => ({ ...f, cidr: e.target.value }))}
            placeholder="CIDR (e.g. 1.2.3.4/32)"
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white sm:w-60"
          />
          <input
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={busy || !form.cidr.trim()}
            className="iz-btn-primary h-9 rounded-lg px-4 text-sm disabled:opacity-50"
          >
            Add ban
          </button>
        </div>
        {err && <p className="text-xs text-rose-300">{err}</p>}
      </form>

      <div className="mt-6 space-y-2">
        {bans.length === 0 && <p className="text-sm text-slate-400">No bans yet.</p>}
        {bans.map((b) => (
          <div
            key={b.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          >
            <div>
              <p className="font-mono text-sm text-white">{b.cidr}</p>
              {b.reason && <p className="mt-1 text-xs text-slate-300">{b.reason}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {new Date(b.created_at).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Remove ban for ${b.cidr}?`)) return;
                const res = await fetch(
                  `/api/admin/ip-bans?id=${encodeURIComponent(b.id)}`,
                  { method: 'DELETE', credentials: 'include' }
                );
                if (res.ok) await refresh();
              }}
              className="text-xs text-rose-300 hover:text-rose-200"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
