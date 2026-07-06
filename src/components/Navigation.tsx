'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const PENDING_POLL_MS = 60_000;

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const adminLinks = [
    {
      href: '/admin/moderation',
      label: 'Moderate',
      badge: pendingCount && pendingCount > 0 ? (pendingCount > 99 ? '99+' : String(pendingCount)) : null,
      ariaLabel:
        pendingCount && pendingCount > 0 ? `Moderate (${pendingCount} pending)` : 'Moderate',
    },
    { href: '/admin/bans', label: 'Bans' },
    { href: '/admin/audit-logs', label: 'Audit' },
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/analytics', label: 'Analytics' },
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl"
      aria-label="Main navigation"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="iz-gradient-text rounded text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            aria-label="Isla Zone home"
          >
            Isla Zone
          </Link>
          {user && isAdmin && (
            <div className="hidden items-center gap-1 md:flex">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label={link.ariaLabel}
                >
                  {link.label}
                  {link.badge ? (
                    <span
                      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                      aria-hidden="true"
                    >
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.email}
            </span>
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-admin-menu"
                aria-label={mobileMenuOpen ? 'Close admin menu' : 'Open admin menu'}
              >
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className={`iz-btn-ghost rounded-lg px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 ${
                isAdmin ? 'hidden md:inline-flex' : ''
              }`}
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      {user && isAdmin && mobileMenuOpen ? (
        <div
          id="mobile-admin-menu"
          className="border-t border-white/10 bg-slate-950/95 px-4 py-3 md:hidden"
          style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Admin shortcuts
            </p>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                aria-label={link.ariaLabel}
              >
                <span>{link.label}</span>
                {link.badge ? (
                  <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
              {user.email}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="iz-btn-ghost inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
