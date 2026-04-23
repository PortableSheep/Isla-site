'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { SuspensionData } from '@/types/suspension';
import { SuspensionNotice } from './suspension/SuspensionNotice';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowSuspended?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = '/auth/login',
  allowSuspended = false,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [suspension, setSuspension] = useState<SuspensionData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSuspension = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select(
            'suspended, suspended_at, suspended_by, suspension_reason, suspension_reason_text, suspension_duration_days, suspension_expires_at, appeal_status, appeal_submitted_at'
          )
          .eq('user_id', user.id)
          .single();

        if (!error && profile) {
          setSuspension(profile as unknown as SuspensionData);
        }
      } catch (err) {
        console.error('Error checking suspension status:', err);
      } finally {
        setChecking(false);
      }
    };

    checkSuspension();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check auto-unsuspend for expired suspensions
  if (
    suspension?.suspended &&
    suspension.suspension_expires_at &&
    new Date(suspension.suspension_expires_at) < new Date()
  ) {
    // Auto-unsuspend is handled by checking at login, just show normal view
    return <>{children}</>;
  }

  // Show suspension notice if user is suspended and not on allowed pages
  if (suspension?.suspended && !allowSuspended) {
    return <SuspensionNotice suspension={suspension} />;
  }

  return <>{children}</>;
}
