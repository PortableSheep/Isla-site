'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

type Mode = 'loading' | 'guest' | 'admin' | 'user';

export function WallCornerAuthLink() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('loading');

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (loading) return;
      if (!user) {
        if (!cancelled) setMode('guest');
        return;
      }
      try {
        const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
        if (cancelled) return;
        if (error) {
          console.error('[wall corner] is_admin failed', error);
          setMode('user');
          return;
        }
        setMode(data === true ? 'admin' : 'user');
      } catch (err) {
        if (cancelled) return;
        console.error('[wall corner] is_admin threw', err);
        setMode('user');
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (mode === 'loading' || mode === 'user') {
    // While we don't know, and for non-admin signed-in users, don't render
    // anything (keeps the wall clean for Isla herself).
    return null;
  }

  if (mode === 'admin') {
    return (
      <Link
        href="/admin/moderation"
        aria-label="Open moderation dashboard"
        title="Moderation"
        className="fixed top-3 right-3 z-30 flex h-9 items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-slate-900/70 px-3 text-xs font-medium text-fuchsia-200 backdrop-blur-md transition hover:border-fuchsia-300 hover:bg-slate-900/90 hover:text-fuchsia-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>Moderate</span>
      </Link>
    );
  }

  // guest
  return (
    <Link
      href="/auth/login"
      aria-label="Sign in (Isla &amp; admins)"
      title="Sign in"
      className="fixed top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-slate-500 backdrop-blur-md transition hover:border-fuchsia-400/40 hover:bg-slate-900/80 hover:text-fuchsia-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M15.5 7.5a3.5 3.5 0 1 1-3.39 4.39L8 16l-2 0 0 2-2 0 0 2-2 0 0-2.59a1 1 0 0 1 .29-.7L9.11 11.1A3.5 3.5 0 1 1 15.5 7.5Z" />
        <circle cx="16" cy="8" r="0.9" fill="currentColor" />
      </svg>
    </Link>
  );
}
