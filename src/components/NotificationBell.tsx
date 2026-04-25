'use client';

import { useEffect, useState } from 'react';
import {
  getPushPermissionState,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications';

type State = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed';

function Glyph({ children, spin = false }: { children: string; spin?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`text-lg leading-none ${spin ? 'inline-block animate-spin' : ''}`}
      style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
    >
      {children}
    </span>
  );
}

export default function NotificationBell() {
  const [state, setState] = useState<State>('unsubscribed');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const perm = getPushPermissionState();
    if (perm === 'unsupported') {
      setState('unsupported');
      return;
    }
    if (perm === 'denied') {
      setState('denied');
      return;
    }
    getCurrentPushSubscription().then((sub) => {
      setState(sub ? 'subscribed' : 'unsubscribed');
    });
  }, []);

  if (state === 'unsupported') {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/60 bg-slate-900/90 backdrop-blur-md"
        title="Push notifications not supported on this browser"
        aria-label="Push notifications not supported"
      >
        <Glyph>🔕</Glyph>
      </div>
    );
  }

  const handleClick = async () => {
    if (busy) return;
    setHint(null);

    if (state === 'denied') {
      setHint('Notifications are blocked. Enable them in your browser settings.');
      setTimeout(() => setHint(null), 4000);
      return;
    }

    setBusy(true);
    try {
      if (state === 'subscribed') {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setState('unsubscribed');
          setHint('Notifications turned off.');
        } else {
          setHint('Could not unsubscribe. Try again.');
        }
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setState('subscribed');
          setHint("You're subscribed! You'll get a ping when new posts arrive.");
        } else {
          const perm = getPushPermissionState();
          if (perm === 'denied') {
            setState('denied');
            setHint('Permission denied. Enable notifications in your browser settings.');
          } else {
            setHint('Subscription failed. Try again.');
          }
        }
      }
    } finally {
      setBusy(false);
      setTimeout(() => setHint(null), 4000);
    }
  };

  const label =
    state === 'subscribed'
      ? 'Turn off notifications'
      : state === 'denied'
      ? 'Notifications blocked'
      : 'Get notified of new posts';

  const glyph = busy
    ? '⏳'
    : state === 'subscribed'
    ? '🔔'
    : state === 'denied'
    ? '🔕'
    : '🔔';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60 ${
          state === 'subscribed'
            ? 'border-fuchsia-400/70 bg-slate-900/90 hover:border-fuchsia-300 hover:bg-slate-900 shadow-lg shadow-fuchsia-500/30'
            : state === 'denied'
            ? 'border-slate-600/60 bg-slate-900/90 opacity-70'
            : 'border-fuchsia-400/40 bg-slate-900/90 hover:border-fuchsia-300 hover:bg-slate-900 shadow-lg shadow-fuchsia-500/10'
        }`}
      >
        <Glyph spin={busy}>{glyph}</Glyph>
      </button>
      {hint && (
        <div className="absolute right-0 top-11 z-50 w-max max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-md">
          {hint}
        </div>
      )}
    </div>
  );
}
