'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { InviteInfoComponent } from '@/components/InviteInfo';
import { InviteInfo } from '@/lib/inviteFlow';
import { AcceptInviteButton } from '@/components/AcceptInviteButton';

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        if (!token) {
          setError('No invite token provided');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/invites/info/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load invite');
          setInviteInfo({
            id: '',
            name: '',
            memberCount: 0,
            status: 'invalid',
          });
          setLoading(false);
          return;
        }

        setInviteInfo(data);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('Failed to load invite information');
        setInviteInfo({
          id: '',
          name: '',
          memberCount: 0,
          status: 'invalid',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [token]);

  useEffect(() => {
    // If user is not authenticated and invite is valid, redirect to signup
    if (!authLoading && !user && inviteInfo && inviteInfo.status === 'valid') {
      // Wait a moment to show the invite info, then redirect
      const timer = setTimeout(() => {
        router.push(`/auth/signup-via-invite?token=${token}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, inviteInfo, token, router]);

  if (loading || authLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-4">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
          <p>Unable to load invite information. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Family Invite</h1>
        <p className="text-gray-400">Join your family on Isla Zone</p>
      </div>

      <div className="space-y-6">
        <InviteInfoComponent inviteInfo={inviteInfo} />

        {inviteInfo.status === 'valid' && (
          <>
            {user ? (
              <AcceptInviteButton token={token} />
            ) : (
              <div className="bg-blue-900/20 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg text-center text-sm">
                <p>Redirecting to create your account...</p>
              </div>
            )}
          </>
        )}

        {inviteInfo.status === 'expired' && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              The family administrator can send you a new invite.
            </p>
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Return to Home
            </a>
          </div>
        )}

        {inviteInfo.status === 'redeemed' && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              {user ? 'You are already a member of this family.' : 'This invite has already been used.'}
            </p>
            <a
              href={user ? '/dashboard' : '/auth/login'}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {user ? 'Go to Dashboard' : 'Sign In'}
            </a>
          </div>
        )}

        {inviteInfo.status === 'invalid' && (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              This invite link is not valid or does not exist.
            </p>
            <a
              href={user ? '/dashboard' : '/'}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {user ? 'Go to Dashboard' : 'Return to Home'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
