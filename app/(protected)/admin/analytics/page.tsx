'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { CreatureDisplay } from '@/components/CreatureDisplay';

type Timeframe = '24h' | '7d' | '30d' | '90d';

interface TopEntry {
  key: string;
  count: number;
}

interface SummaryResponse {
  timeframe: Timeframe;
  days: number;
  generatedAt: string;
  totals: { views: number; visitors: number; sessions: number; loggedInViews: number };
  totals24h: { views: number; visitors: number };
  timeseries: { date: string; views: number; visitors: number }[];
  topPaths: TopEntry[];
  topReferrers: TopEntry[];
  topCountries: TopEntry[];
  topRegions: TopEntry[];
  topCities: TopEntry[];
  devices: TopEntry[];
  truncated: boolean;
}

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: '24h', label: '24 hours' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
];

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function TopList({ title, entries, emptyLabel }: { title: string; entries: TopEntry[]; emptyLabel?: string }) {
  const max = entries[0]?.count ?? 0;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>
      {entries.length === 0 ? (
        <div className="text-sm text-slate-500">{emptyLabel ?? 'No data yet.'}</div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-300" title={e.key}>
                  {e.key}
                </span>
                <span className="tabular-nums text-slate-400">{e.count}</span>
              </div>
              <div className="mt-1 h-1 rounded bg-white/5">
                <div
                  className="h-1 rounded bg-fuchsia-500/60"
                  style={{ width: `${max ? (e.count / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Inline SVG sparkline — no chart dep, no client hydration surprises. */
function Sparkline({ data }: { data: { date: string; views: number; visitors: number }[] }) {
  const width = 720;
  const height = 160;
  const pad = 24;
  const maxViews = Math.max(1, ...data.map((d) => d.views));
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;

  const pathFor = (key: 'views' | 'visitors') =>
    data
      .map((d, i) => {
        const x = pad + i * stepX;
        const y = height - pad - (d[key] / maxViews) * (height - pad * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const labelEvery = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">Daily traffic</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Daily views and visitors">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.08)" />
        <path d={pathFor('views')} fill="none" stroke="#e879f9" strokeWidth="2" />
        <path d={pathFor('visitors')} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.date}
              x={pad + i * stepX}
              y={height - 6}
              fill="rgba(148,163,184,0.7)"
              fontSize="10"
              textAnchor="middle"
            >
              {d.date.slice(5)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 bg-fuchsia-400" />Views</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-4 border-t border-dashed border-sky-400" />Visitors</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) return;
      try {
        const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
        if (error || data !== true) {
          router.push('/');
          return;
        }
        setIsAdmin(true);
      } catch {
        router.push('/');
        return;
      } finally {
        setCheckingAdmin(false);
      }
    }
    if (!loading) checkAdminAccess();
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setDataLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/analytics/summary?timeframe=${timeframe}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed (${res.status})`);
        }
        const json = (await res.json()) as SummaryResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, timeframe]);

  const generatedAt = useMemo(
    () => (data ? new Date(data.generatedAt).toLocaleString() : null),
    [data],
  );

  if (loading || checkingAdmin || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <CreatureDisplay creatureId="drift" state="processing" animation="gentle_bounce" size="large" />
          </div>
          <p className="font-medium text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Site analytics</h1>
          <p className="text-sm text-slate-400">
            Homegrown page-view tracking. No raw IPs stored; DNT and bots skipped.
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Timeframe">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              role="tab"
              aria-selected={timeframe === tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                timeframe === tf.key
                  ? 'bg-fuchsia-500/20 text-fuchsia-200 ring-1 ring-fuchsia-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {dataLoading && !data ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-8 text-center text-slate-400">
          Loading…
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Visitors (24h)"
              value={data.totals24h.visitors}
              hint={`${data.totals24h.views} views`}
            />
            <StatCard
              label={`Visitors (${data.days}d)`}
              value={data.totals.visitors}
              hint={`${data.totals.views} views`}
            />
            <StatCard label="Sessions" value={data.totals.sessions} hint={`${data.days}-day window`} />
            <StatCard
              label="Logged-in views"
              value={data.totals.loggedInViews}
              hint={`${data.days}-day window`}
            />
          </div>

          <div className="mt-4">
            <Sparkline data={data.timeseries} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TopList title="Top pages" entries={data.topPaths} />
            <TopList title="Top referrers (external)" entries={data.topReferrers} emptyLabel="No external referrers yet." />
            <TopList title="Top countries" entries={data.topCountries} />
            <TopList title="Top regions (state/region)" entries={data.topRegions} />
            <TopList title="Top cities" entries={data.topCities} />
            <TopList title="Devices" entries={data.devices} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Generated {generatedAt}</span>
            {data.truncated ? (
              <span className="text-amber-300">
                Showing latest 50,000 rows in window — totals may undercount. Consider a tighter timeframe.
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
