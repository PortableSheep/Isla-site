'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.rpc('is_admin', { uid: user.id });
        router.replace(data === true ? '/admin/moderation' : '/');
      } catch {
        router.replace('/');
      }
    })();
  }, [user, loading, router]);

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
        <p className="text-sm text-slate-400">Taking you to the right place…</p>
      </div>
    </div>
  );
}
