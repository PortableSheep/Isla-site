'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js once on app load. The push subscribe flow also registers
 * lazily, but registering up-front means:
 *   - The bell can show "subscribed" state immediately on first paint when a
 *     subscription already exists.
 *   - The SW is alive and able to fire `pushsubscriptionchange` recovery
 *     before the user ever taps the bell.
 *   - Push deliveries that arrive before the user opens the page still wake
 *     a registered worker.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('SW registration failed:', err);
    });
  }, []);

  return null;
}
