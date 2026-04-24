'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

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
                className="rounded-lg px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                Moderate
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
