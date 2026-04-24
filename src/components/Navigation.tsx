'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const PENDING_POLL_MS = 60_000;

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.rpc('is_admin', { uid: user.id });
        setIsAdmin(data === true);
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [user]);

  // Poll the moderation queue count while an admin is logged in. Refreshes
  // on window focus so switching tabs shows a fresh badge immediately.
  useEffect(() => {
    if (!isAdmin) {
      // No reset needed — the badge is only rendered when isAdmin is true.
      return;
    }
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/admin/moderation-count', { cache: 'no-store' });
        if (!res.ok) return;
        const body = (await res.json()) as { count?: number };
        if (!cancelled && typeof body.count === 'number') {
          setPendingCount(body.count);
        }
      } catch {
        // Silent — the badge just won't update this tick.
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, PENDING_POLL_MS);
    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="iz-gradient-text rounded text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            aria-label="Isla Zone home"
          >
            Isla Zone
          </a>
          {user && isAdmin && (
            <div className="hidden items-center gap-1 md:flex">
              <a
                href="/admin/moderation"
                className="relative rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                aria-label={
                  pendingCount && pendingCount > 0
                    ? `Moderate (${pendingCount} pending)`
                    : 'Moderate'
                }
              >
                Moderate
                {pendingCount && pendingCount > 0 ? (
                  <span
                    className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                    aria-hidden="true"
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                ) : null}
              </a>
              <a
                href="/admin/bans"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                Bans
              </a>
              <a
                href="/admin/audit-logs"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                Audit
              </a>
              <a
                href="/admin/analytics"
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                Analytics
              </a>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="iz-btn-ghost rounded-lg px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
