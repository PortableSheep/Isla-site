'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { AppealForm } from '@/components/suspension/AppealForm';
import type { SuspensionAppeal, SuspensionData } from '@/types/suspension';

export default function AppealPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSuspended, setIsSuspended] = useState(false);
  const [previousAppeal, setPreviousAppeal] = useState<SuspensionAppeal | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setChecking(true);
    setError(null);
    try {
      const [{ data: profile, error: profileErr }, appealRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select(
            'suspended, suspended_at, suspended_by, suspension_reason, suspension_reason_text, suspension_duration_days, suspension_expires_at, appeal_status, appeal_submitted_at'
          )
          .eq('user_id', user!.id)
          .maybeSingle(),
        fetch('/api/users/appeal', { credentials: 'include' }),
      ]);
      if (profileErr) throw new Error(profileErr.message);
      setIsSuspended(Boolean((profile as SuspensionData | null)?.suspended));

      if (!appealRes.ok) {
        const body = await appealRes.json().catch(() => null);
        throw new Error(body?.error || `Failed (${appealRes.status})`);
      }
      const body = (await appealRes.json()) as { previousAppeal?: SuspensionAppeal | null };
      setPreviousAppeal(body.previousAppeal ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appeal data');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="iz-gradient-text text-3xl font-bold">Appeals</h1>
        <Link href="/" className="text-sm text-fuchsia-300 hover:underline">
          ← Back to wall
        </Link>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {!isSuspended ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
          Your account is not currently suspended. You can still view your previous appeal history here.
        </div>
      ) : null}

      <AppealForm onSubmitSuccess={load} previousAppeal={previousAppeal} />
    </main>
  );
}
