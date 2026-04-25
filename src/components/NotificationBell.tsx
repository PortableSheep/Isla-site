'use client';

import { useEffect, useState } from 'react';
import {
  getPushPermissionState,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications';

type State = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed';

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

function BellPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M15 8h6" />
      <path d="M18 5v6" />
      <path d="M20.002 14.464a9 9 0 0 0 .738.863A1 1 0 0 1 20 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 8.75-5.332" />
    </svg>
  );
}

function BellOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" />
      <path d="m2 2 20 20" />
      <path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
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

  if (state === 'unsupported') return null;

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

  const iconClass = `h-4 w-4 ${busy ? 'animate-spin' : ''}`;
  const Icon = busy
    ? SpinnerIcon
    : state === 'subscribed'
    ? BellIcon
    : state === 'denied'
    ? BellOffIcon
    : BellPlusIcon;

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
        <Icon className={iconClass} />
      </button>
      {hint && (
        <div className="absolute left-0 top-10 z-40 w-max max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-md">
          {hint}
        </div>
      )}
    </div>
  );
}
