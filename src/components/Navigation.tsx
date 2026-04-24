'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isIslaUser } from '@/lib/islaUser';
import NotificationBell from './NotificationBell';

export function Navigation() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isIsla, setIsIsla] = useState(false);
  const [checkingIsla, setCheckingIsla] = useState(true);

  useEffect(() => {
    const checkIsla = async () => {
      if (user) {
        const isIslaCheck = await isIslaUser(user.id);
        setIsIsla(isIslaCheck);
      }
      setCheckingIsla(false);
    };

    checkIsla();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="font-bold text-lg iz-gradient-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded"
              aria-label="Isla Zone home"
            >
              Isla Zone
            </a>
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {!checkingIsla && isIsla && (
                  <a
                    href="/compose"
                    className="text-fuchsia-300 hover:text-fuchsia-200 text-sm font-medium transition-colors flex items-center gap-1 rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                    aria-label="Compose new message"
                  >
                    <span aria-hidden="true">✨</span>
                    Compose
                  </a>
                )}
                <a
                  href="/dashboard"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="Go to dashboard"
                >
                  Dashboard
                </a>
                <a
                  href="/approvals"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="View approvals"
                >
                  Approvals
                </a>
                <a
                  href="/approvals/history"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="View approval history"
                >
                  History
                </a>
                <a
                  href="/wall"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="Go to message wall"
                >
                  Wall
                </a>
                <a
                  href="/admin/moderation"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="Moderation queue"
                >
                  Moderate
                </a>
                <a
                  href="/admin/bans"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="IP bans"
                >
                  Bans
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <NotificationBell userId={user.id} />
                <span
                  className="hidden sm:inline text-slate-400 text-sm"
                  aria-label={`Logged in as ${user.email}`}
                >
                  {user.email}
                </span>
                <a
                  href="/settings"
                  className="text-slate-300 hover:text-white text-sm transition-colors rounded-lg px-3 py-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="Go to settings"
                >
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="iz-btn-ghost rounded-lg px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label="Log out from Isla Zone"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
