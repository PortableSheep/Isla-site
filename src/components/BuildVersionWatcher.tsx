'use client';

import { useEffect, useRef } from 'react';

// Polls /api/build-id and reloads the page when the deployed commit SHA
// differs from the one this document was rendered with. Especially useful
// for installed PWAs (iOS) that aggressively cache HTML and can otherwise
// stay on an old build for days.
//
// Trigger points:
//   - Once on mount (sets the baseline)
//   - On visibilitychange when the document becomes visible (foregrounding)
//   - Every 5 minutes while visible
export default function BuildVersionWatcher() {
  const baselineRef = useRef<string | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchId = async (): Promise<string | null> => {
      try {
        const res = await fetch('/api/build-id', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = (await res.json()) as { id?: string };
        return typeof data.id === 'string' ? data.id : null;
      } catch {
        return null;
      }
    };

    const check = async () => {
      if (cancelled || reloadingRef.current) return;
      const id = await fetchId();
      if (!id) return;
      if (baselineRef.current === null) {
        baselineRef.current = id;
        return;
      }
      if (id !== baselineRef.current) {
        reloadingRef.current = true;
        // Hard reload to pick up new HTML/JS bundles.
        window.location.reload();
      }
    };

    void check();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisibility);

    interval = setInterval(() => {
      if (document.visibilityState === 'visible') void check();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
