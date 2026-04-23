'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ModerationDashboard } from '@/components/moderation';

export default function ModerationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          router.push('/dashboard');
          return;
        }

        if ((data as { role: string } | null)?.role === 'admin') {
          setIsAdmin(true);
          setCheckingAdmin(false);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      }
    }

    if (!loading) {
      checkAdminAccess();
    }
  }, [user, loading, router]);

  if (loading || checkingAdmin || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  return <ModerationDashboard />;
}
