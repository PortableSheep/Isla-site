'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isIslaUser } from '@/lib/islaUser';

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
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <a href="/" className="text-white font-bold text-lg">
              Isla.site
            </a>
            {user && (
              <div className="flex items-center gap-6">
                {!checkingIsla && isIsla && (
                  <a
                    href="/compose"
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <span>✨</span>
                    Compose
                  </a>
                )}
                <a
                  href="/dashboard"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/approvals"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Approvals
                </a>
                <a
                  href="/approvals/history"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  History
                </a>
                 <a
                   href="/wall"
                   className="text-gray-300 hover:text-white text-sm transition-colors"
                 >
                   Wall
                 </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-gray-300 text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
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
