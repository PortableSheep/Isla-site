'use client';

import { useEffect, useState } from 'react';
import {
  getPushPermissionState,
  getCurrentPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications';

type State = 'unsupported' | 'ios-install' | 'denied' | 'unsubscribed' | 'subscribed';

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

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPad on iOS 13+ reports as Mac; detect via touch points
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari legacy flag
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export default function NotificationBell() {
  const [state, setState] = useState<State>('unsubscribed');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const perm = getPushPermissionState();
    if (perm === 'unsupported') {
      // iOS Safari supports push only when installed as a PWA (16.4+).
      if (isIOS() && !isStandalone()) {
        setState('ios-install');
      } else {
        setState('unsupported');
      }
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
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-600/60 bg-slate-900/90 backdrop-blur-md"
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

    if (state === 'ios-install') {
      setHint(
        'On iPhone/iPad, tap the Share button in Safari, then "Add to Home Screen". Open Isla from your home screen icon to enable notifications.',
      );
      setTimeout(() => setHint(null), 9000);
      return;
    }

    if (state === 'denied') {
      setHint('Notifications are blocked. Enable them in your browser settings.');
      setTimeout(() => setHint(null), 5000);
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
        const result = await subscribeToPush();
        if (result.ok) {
          setState('subscribed');
          setHint("You're subscribed! You'll get a ping when new posts arrive.");
        } else if (result.reason === 'permission-denied') {
          const perm = getPushPermissionState();
          if (perm === 'denied') {
            setState('denied');
            setHint('Permission denied. Enable notifications in your browser settings.');
          } else {
            setHint('Permission was not granted.');
          }
        } else if (result.reason === 'no-vapid-key') {
          setHint('Notifications are not configured on this server.');
        } else if (result.reason === 'sw-failed') {
          setHint('Could not register the service worker.');
        } else if (result.reason === 'server-failed') {
          setHint('Server rejected the subscription. Try again later.');
        } else {
          setHint('Subscription failed. Try again.');
        }
      }
    } finally {
      setBusy(false);
      setTimeout(() => setHint(null), 6000);
    }
  };

  const label =
    state === 'subscribed'
      ? 'Turn off notifications'
      : state === 'denied'
      ? 'Notifications blocked'
      : state === 'ios-install'
      ? 'Install Isla to enable notifications'
      : 'Get notified of new posts';

  const glyph = busy ? '⏳' : state === 'denied' ? '🔕' : '🔔';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60 ${
          state === 'subscribed'
            ? 'border-fuchsia-400/80 bg-slate-900/90 hover:border-fuchsia-300 hover:bg-slate-900 shadow-lg shadow-fuchsia-500/30'
            : state === 'denied'
            ? 'border-slate-600/60 bg-slate-900/90 opacity-70'
            : 'border-fuchsia-400/70 bg-slate-900/90 hover:border-fuchsia-300 hover:bg-slate-900 shadow-lg shadow-fuchsia-500/20'
        }`}
      >
        <Glyph spin={busy}>{glyph}</Glyph>
      </button>
      {hint && (
        <div className="absolute right-0 top-11 z-50 w-[260px] max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-200 shadow-xl backdrop-blur-md">
          {hint}
        </div>
      )}
    </div>
  );
}
