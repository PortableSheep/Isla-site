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

type Browser = 'ios-pwa' | 'safari' | 'firefox' | 'chromium' | 'unknown';

function detectBrowser(): Browser {
  if (typeof navigator === 'undefined') return 'unknown';
  if (isIOS() && isStandalone()) return 'ios-pwa';
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) return 'firefox';
  // Edge/Chrome/Brave/Opera all match Chrome substring
  if (/Edg\/|Chrome\/|Chromium\//.test(ua)) return 'chromium';
  if (/Safari\//.test(ua)) return 'safari';
  return 'unknown';
}

function deniedResetHint(): string {
  switch (detectBrowser()) {
    case 'ios-pwa':
      return 'Open the Settings app → Notifications → scroll to Isla → turn on Allow Notifications. Then come back here and tap the bell again.';
    case 'safari':
      return 'Safari → Settings → Websites → Notifications → select isla.zone → Remove. Then click the bell again.';
    case 'firefox':
      return 'Click the lock icon 🔒 in the address bar → Connection secure → More info → Permissions → reset Receive Notifications. Then click the bell again.';
    case 'chromium':
      return 'Click the lock icon 🔒 in the address bar → Site settings → reset Notifications. Then click the bell again.';
    default:
      return 'Notifications are blocked. Re-enable them in your browser or device settings, then click the bell again.';
  }
}

export default function NotificationBell() {
  const [state, setState] = useState<State>('unsubscribed');
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintSticky, setHintSticky] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const perm = getPushPermissionState();
      if (perm === 'unsupported') {
        if (cancelled) return;
        // iOS Safari supports push only when installed as a PWA (16.4+).
        if (isIOS() && !isStandalone()) {
          setState('ios-install');
        } else {
          setState('unsupported');
        }
        return;
      }
      // Even if perm is currently 'denied', check for an existing subscription —
      // and if the OS-level setting has been re-enabled (e.g. iOS Settings),
      // allow the bell to leave the denied state so a tap can re-subscribe.
      const sub = await getCurrentPushSubscription();
      if (cancelled) return;
      if (sub) {
        setState('subscribed');
        return;
      }
      setState(perm === 'denied' ? 'denied' : 'unsubscribed');
    };

    refresh();

    // iOS PWAs persist JS state across background/foreground transitions, so
    // re-check permission whenever the page becomes visible or focused. This
    // recovers from the "denied → enabled in iOS Settings" flow without a
    // full reload.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Auto-dismiss only non-sticky hints.
  useEffect(() => {
    if (!hint || hintSticky) return;
    const t = setTimeout(() => setHint(null), 6000);
    return () => clearTimeout(t);
  }, [hint, hintSticky]);

  const showHint = (msg: string, sticky = false) => {
    setHint(msg);
    setHintSticky(sticky);
  };

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
    // Always clear any prior hint on click.
    setHint(null);
    setHintSticky(false);

    if (state === 'ios-install') {
      showHint(
        'On iPhone/iPad, tap the Share button in Safari, then "Add to Home Screen". Open Isla from your home screen icon to enable notifications.',
        true,
      );
      return;
    }

    // NOTE: We deliberately do NOT short-circuit here on `state === 'denied'`.
    // If the user re-enabled notifications in OS settings (iOS Settings →
    // Notifications → Isla), Notification.requestPermission() will resolve
    // to 'granted' synchronously without showing a prompt, and we can
    // subscribe successfully. Only fall back to the help hint if it really
    // is still denied. This makes the bell self-heal after the iOS Settings
    // dance with no app reload required.

    setBusy(true);
    try {
      if (state === 'subscribed') {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setState('unsubscribed');
          showHint('Notifications turned off.');
        } else {
          showHint('Could not unsubscribe. Try again.');
        }
      } else {
        const result = await subscribeToPush();
        if (result.ok) {
          setState('subscribed');
          showHint("You're subscribed! You'll get a ping when new posts arrive.");
        } else {
          // Re-check permission to detect "default → denied" transitions.
          const perm = getPushPermissionState();
          if (perm === 'denied' || result.reason === 'permission-denied') {
            setState('denied');
            showHint(deniedResetHint(), true);
          } else if (result.reason === 'no-vapid-key') {
            showHint('Notifications are not configured on this server.', true);
          } else if (result.reason === 'sw-failed') {
            showHint(
              `Could not register the service worker.${result.message ? ' (' + result.message.slice(0, 120) + ')' : ''}`,
              true,
            );
          } else if (result.reason === 'server-failed') {
            showHint(
              `Server rejected the subscription.${result.message ? ' (' + result.message + ')' : ''} Try again later.`,
              true,
            );
          } else {
            showHint(
              `Subscription failed.${result.message ? ' ' + result.message.slice(0, 160) : ''} Try again.`,
              true,
            );
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const label =
    state === 'subscribed'
      ? 'Notifications on — tap to turn off'
      : state === 'denied'
      ? 'Notifications blocked — tap for help'
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
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:opacity-60 ${
          state === 'subscribed'
            ? 'border-emerald-400/80 bg-slate-900/90 hover:border-emerald-300 hover:bg-slate-900 shadow-lg shadow-emerald-500/30'
            : state === 'denied'
            ? 'border-amber-400/70 bg-slate-900/90 hover:border-amber-300 hover:bg-slate-900 shadow-lg shadow-amber-500/20'
            : 'border-fuchsia-400/70 bg-slate-900/90 hover:border-fuchsia-300 hover:bg-slate-900 shadow-lg shadow-fuchsia-500/20'
        }`}
      >
        <Glyph spin={busy}>{glyph}</Glyph>
        {state === 'subscribed' && !busy && (
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
          />
        )}
      </button>
      {hint && (
        <div className="absolute right-0 top-11 z-50 w-[280px] max-w-[calc(100vw-2rem)] rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs leading-relaxed text-slate-200 shadow-xl backdrop-blur-md">
          <div>{hint}</div>
          {hintSticky && (
            <button
              type="button"
              onClick={() => {
                setHint(null);
                setHintSticky(false);
              }}
              className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-200"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
