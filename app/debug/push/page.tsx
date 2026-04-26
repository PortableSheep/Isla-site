'use client';

import { useEffect, useState } from 'react';
import {
  getPushPermissionState,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermissionState,
} from '@/lib/pushNotifications';

type SwInfo = {
  registered: boolean;
  scope?: string;
  active?: string;
  scriptURL?: string;
};

function truncate(s: string, head = 32, tail = 12) {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 py-1.5 border-b border-slate-800 text-sm">
      <div className="text-slate-400">{label}</div>
      <div className="font-mono break-all text-slate-100">{value}</div>
    </div>
  );
}

export default function PushDebugPage() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [sw, setSw] = useState<SwInfo>({ registered: false });
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [vapidPresent, setVapidPresent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (msg: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${msg}`, ...l].slice(0, 50));

  const refresh = async () => {
    setPermission(getPushPermissionState());
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        setSw({
          registered: true,
          scope: reg.scope,
          active: reg.active?.state,
          scriptURL: reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL,
        });
      } else {
        setSw({ registered: false });
      }
    }
    const sub = await getCurrentPushSubscription();
    setEndpoint(sub?.endpoint ?? null);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    fetch('/api/push/vapid-key')
      .then((r) => r.json())
      .then((d: { key?: string }) => setVapidPresent(!!d.key))
      .catch(() => setVapidPresent(false));
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const handleSubscribe = async () => {
    setBusy(true);
    try {
      const r = await subscribeToPush();
      append(r.ok ? 'subscribeToPush: ok' : `subscribeToPush: ${r.reason}${r.message ? ` — ${r.message}` : ''}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleUnsubscribe = async () => {
    setBusy(true);
    try {
      const ok = await unsubscribeFromPush();
      append(`unsubscribeFromPush: ${ok ? 'ok' : 'failed'}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleTestPush = async () => {
    if (!endpoint) {
      append('test push: no endpoint — subscribe first');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        append('test push: server accepted — watch for the notification');
      } else {
        append(`test push: HTTP ${res.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      append(`test push: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold mb-2">Push notifications — debug</h1>
        <p className="text-sm text-slate-400 mb-6">
          Open this page on the device that&apos;s having trouble. Everything below reflects this
          device only.
        </p>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 mb-6">
          <Row label="User agent" value={typeof navigator !== 'undefined' ? navigator.userAgent : '—'} />
          <Row label="Display mode" value={isStandalone() ? 'standalone (PWA)' : 'browser tab'} />
          <Row label="Notification.permission" value={permission} />
          <Row label="VAPID public key" value={vapidPresent === null ? '…' : vapidPresent ? 'present' : 'MISSING on server'} />
          <Row label="Service worker" value={sw.registered ? `registered (${sw.active ?? 'unknown'})` : 'not registered'} />
          {sw.scope && <Row label="SW scope" value={sw.scope} />}
          {sw.scriptURL && <Row label="SW script" value={sw.scriptURL} />}
          <Row label="Subscription endpoint" value={endpoint ? truncate(endpoint) : 'none'} />
        </section>

        <section className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleSubscribe}
            disabled={busy}
            className="px-4 py-2 rounded-md bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-sm font-medium"
          >
            Subscribe / re-subscribe
          </button>
          <button
            onClick={handleUnsubscribe}
            disabled={busy || !endpoint}
            className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-sm font-medium"
          >
            Unsubscribe
          </button>
          <button
            onClick={handleTestPush}
            disabled={busy || !endpoint}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium"
          >
            Send test push to me
          </button>
          <button
            onClick={refresh}
            disabled={busy}
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm font-medium"
          >
            Refresh
          </button>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-sm font-semibold mb-2 text-slate-300">Activity log</h2>
          {log.length === 0 ? (
            <p className="text-xs text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-1 text-xs font-mono text-slate-300">
              {log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-500">
          iOS notes: push only works when this site is launched from the Home Screen (PWA), and
          only on iOS/iPadOS 16.4+. If notifications were previously denied, enable them in
          Settings → Notifications → Isla, then come back here and tap Subscribe.
        </p>
      </div>
    </div>
  );
}
