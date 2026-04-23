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
      className="bg-gray-900 border-b border-gray-800"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <a 
              href="/" 
              className="text-white font-bold text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              aria-label="Isla.site home"
            >
              Isla.site
            </a>
            {user && (
              <div className="flex items-center gap-6">
                {!checkingIsla && isIsla && (
                  <a
                    href="/compose"
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                    aria-label="Compose new message"
                  >
                    <span aria-hidden="true">✨</span>
                    Compose
                  </a>
                )}
                <a
                  href="/dashboard"
                  className="text-gray-300 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                  aria-label="Go to dashboard"
                >
                  Dashboard
                </a>
                <a
                  href="/approvals"
                  className="text-gray-300 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                  aria-label="View approvals"
                >
                  Approvals
                </a>
                <a
                  href="/approvals/history"
                  className="text-gray-300 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                  aria-label="View approval history"
                >
                  History
                </a>
                 <a
                   href="/wall"
                   className="text-gray-300 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                   aria-label="Go to message wall"
                 >
                   Wall
                 </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                {user && <NotificationBell userId={user.id} />}
                <span 
                  className="text-gray-300 text-sm"
                  aria-label={`Logged in as ${user.email}`}
                >
                  {user.email}
                </span>
                <a
                  href="/settings"
                  className="text-gray-300 hover:text-white text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded px-2 py-1"
                  aria-label="Go to settings"
                >
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  aria-label="Log out from Isla.site"
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
