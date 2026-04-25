'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellPlus, Loader2 } from 'lucide-react';
import {
  getPushPermissionState,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications';

type State = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed';

export default function NotificationBell() {
  const [state, setState] = useState<State>('unsubscribed');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Detect current state on mount
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

  if (state === 'unsupported') return null;

  const handleClick = async () => {
    if (busy) return;
    setHint(null);

    if (state === 'denied') {
      setHint('Notifications are blocked. Enable them in your browser settings.');
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
          // Re-check permission to show the right state
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
      // Auto-clear hint after a moment
      setTimeout(() => setHint(null), 4000);
    }
  };

  const label =
    state === 'subscribed'
      ? 'Turn off notifications'
      : state === 'denied'
      ? 'Notifications blocked'
      : 'Get notified of new posts';

  const Icon = busy
    ? Loader2
    : state === 'subscribed'
    ? Bell
    : state === 'denied'
    ? BellOff
    : BellPlus;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        title={label}
        className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-md backdrop-blur-md transition disabled:opacity-60 ${
          state === 'subscribed'
            ? 'border-fuchsia-400/40 bg-slate-900/90 text-fuchsia-300 hover:border-fuchsia-400/70'
            : state === 'denied'
            ? 'border-slate-500/30 bg-slate-900/90 text-slate-500'
            : 'border-slate-400/25 bg-slate-900/90 text-slate-300 hover:border-slate-300/50 hover:text-slate-100'
        }`}
      >
        <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
      </button>
      {hint && (
        <div className="absolute left-0 top-10 z-40 w-max max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-md">
          {hint}
        </div>
      )}
    </div>
  );
}
