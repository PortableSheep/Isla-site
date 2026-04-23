'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ModerationDashboard } from '@/components/moderation';
import { CreatureDisplay } from '@/components/CreatureDisplay';

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-950 dark:to-blue-950">
        <div className="text-center">
          <div className="inline-block mb-4">
            <CreatureDisplay
              creatureId="drift"
              state="processing"
              animation="gentle_bounce"
              size="large"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-950 dark:via-blue-950 dark:to-gray-900">
      <ModerationDashboard />
    </div>
  );
}
