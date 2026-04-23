'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppealForm } from '@/components/suspension/AppealForm';
import { SuspensionAppeal } from '@/types/suspension';

export default function AppealPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [suspended, setSuspended] = useState(false);
  const [previousAppeal, setPreviousAppeal] = useState<SuspensionAppeal | null>(
    null
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSuspensionAndAppeals = async () => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // Check suspension status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('suspended')
          .eq('user_id', user.id)
          .single();

        if (profile && (profile as { suspended: boolean }).suspended) {
          setSuspended(true);
        } else {
          // Not suspended, redirect to wall
          router.push('/wall');
          return;
        }

        // Get previous appeals
        const { data: appeals } = await supabase
          .from('suspension_appeals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (appeals && appeals.length > 0) {
          setPreviousAppeal(appeals[0] as unknown as SuspensionAppeal);
        }
      } catch (err) {
        console.error('Error checking appeals:', err);
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkSuspensionAndAppeals();
    }
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!suspended) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Suspension Appeal
          </h1>
          <p className="text-gray-600">
            Submit an appeal if you believe your account suspension was made in error.
          </p>
        </div>

        <AppealForm previousAppeal={previousAppeal} />

        {previousAppeal && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Appeal History</h2>
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {previousAppeal.status === 'pending' && 'Pending Review'}
                    {previousAppeal.status === 'approved' && 'Approved'}
                    {previousAppeal.status === 'rejected' && 'Rejected'}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      previousAppeal.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : previousAppeal.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {previousAppeal.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  Submitted on{' '}
                  {new Date(previousAppeal.created_at).toLocaleDateString()}
                </p>

                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 break-words">
                    {previousAppeal.appeal_text}
                  </p>
                </div>

                {previousAppeal.reviewed_at && (
                  <p className="text-xs text-gray-500">
                    Reviewed on{' '}
                    {new Date(previousAppeal.reviewed_at).toLocaleDateString()}
                  </p>
                )}

                {previousAppeal.review_response && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                      Moderator Response:
                    </p>
                    <p className="text-sm text-gray-600 break-words">
                      {previousAppeal.review_response}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
