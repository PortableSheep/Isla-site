'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { AI_THRESHOLD_FIELDS } from '@/lib/moderationThresholds';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [maintenance, setMaintenance] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, string>>({});
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState<string | null>(null);

  // Admin check
  useEffect(() => {
    if (!user) return;
    supabase.rpc('is_admin', { uid: user.id }).then(({ data, error }) => {
      if (error || !data) { router.push('/'); return; }
      setIsAdmin(true);
      setCheckingAdmin(false);
    });
  }, [user, router]);

  // Load current settings
  useEffect(() => {
    if (!isAdmin) return;
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        const settings = json.settings ?? {};
        const val = settings.maintenance_mode;
        setMaintenance(val === 'true');
        const nextThresholds: Record<string, string> = {};
        for (const field of AI_THRESHOLD_FIELDS) {
          nextThresholds[field.key] = settings[field.key] ?? String(field.defaultValue);
        }
        setThresholds(nextThresholds);
      })
      .catch(() => setMsg('Failed to load settings'));
  }, [isAdmin]);

  const toggle = async () => {
    if (maintenance === null) return;
    setSaving(true);
    setMsg(null);
    const next = !maintenance;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: 'maintenance_mode', value: String(next) }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setMaintenance(next);
      setMsg(next ? '🔒 Maintenance mode ON — site redirects to maintenance page.' : '✅ Maintenance mode OFF — site is live.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const saveThresholds = async () => {
    setSavingThresholds(true);
    setThresholdMsg(null);
    try {
      const updates: Record<string, string> = {};
      for (const field of AI_THRESHOLD_FIELDS) {
        const value = thresholds[field.key];
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
          throw new Error(`${field.label} must be between 0 and 1`);
        }
        updates[field.key] = parsed.toFixed(2);
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.detail || json?.error || `Failed (${res.status})`);
      }
      setThresholds(updates);
      setThresholdMsg('✅ AI moderation thresholds saved.');
    } catch (e) {
      setThresholdMsg(e instanceof Error ? e.message : 'Error saving thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  if (loading || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-white">
      <h1 className="mb-6 text-2xl font-bold">Site Settings</h1>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-100">Maintenance Mode</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              When on, all visitors are redirected to the maintenance page.
              API, auth, and admin routes stay accessible.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={maintenance ?? false}
            onClick={toggle}
            disabled={saving || maintenance === null}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:cursor-wait disabled:opacity-50 ${
              maintenance
                ? 'border-fuchsia-400/60 bg-fuchsia-500/40'
                : 'border-white/20 bg-white/10'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 translate-y-0 rounded-full bg-white shadow transition-transform ${
                maintenance ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              maintenance ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-sm text-slate-400">
            {maintenance === null
              ? 'Loading…'
              : maintenance
              ? 'Site is in maintenance mode'
              : 'Site is live'}
          </span>
        </div>

        {msg && (
          <p className={`mt-3 text-sm ${msg.startsWith('✅') || msg.startsWith('🔒') ? 'text-emerald-300' : 'text-rose-300'}`}>
            {msg}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3 text-xs text-slate-500">
        Changes take effect within ~30 seconds (middleware caches the setting).
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="font-semibold text-slate-100">AI Moderation Thresholds</h2>
        <p className="mt-1 text-sm text-slate-400">
          Lower values are stricter and send more content to moderation.
          Values are decimals from 0 to 1.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AI_THRESHOLD_FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-sm">
              <span className="text-slate-200">{field.label}</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={thresholds[field.key] ?? String(field.defaultValue)}
                onChange={(e) =>
                  setThresholds((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-white outline-none ring-fuchsia-400/60 placeholder:text-slate-500 focus:ring-2"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveThresholds}
            disabled={savingThresholds}
            className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:cursor-wait disabled:opacity-60"
          >
            {savingThresholds ? 'Saving…' : 'Save AI thresholds'}
          </button>
          <button
            type="button"
            onClick={() =>
              setThresholds(
                Object.fromEntries(
                  AI_THRESHOLD_FIELDS.map((field) => [field.key, String(field.defaultValue)])
                )
              )
            }
            disabled={savingThresholds}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 disabled:opacity-60"
          >
            Reset defaults
          </button>
        </div>

        {thresholdMsg && (
          <p
            className={`mt-3 text-sm ${
              thresholdMsg.startsWith('✅') ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {thresholdMsg}
          </p>
        )}
      </div>

      <a href="/admin/moderation" className="mt-6 inline-block text-sm text-fuchsia-300 hover:underline">
        ← Back to admin
      </a>
    </main>
  );
}
