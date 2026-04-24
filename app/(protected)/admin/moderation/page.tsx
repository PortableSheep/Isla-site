'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { WallModerationDashboard } from '@/components/moderation/WallModerationDashboard';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function ModerationPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) return;
      try {
        const { data, error } = await supabase.rpc('is_admin', { uid: user.id });
        if (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
          return;
        }
        if (data === true) {
          setIsAdmin(true);
          setCheckingAdmin(false);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      }
    }

    if (!loading) checkAdminAccess();
  }, [user, loading, router]);

  if (loading || checkingAdmin || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <CreatureDisplay
              creatureId="drift"
              state="processing"
              animation="gentle_bounce"
              size="large"
            />
          </div>
          <p className="font-medium text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <WallModerationDashboard />;
}
