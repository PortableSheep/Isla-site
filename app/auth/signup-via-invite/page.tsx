'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signUp, validateEmail, validatePassword } from '@/lib/auth';
import { acceptInvite } from '@/lib/inviteFlow';
import { InviteInfo } from '@/lib/inviteFlow';

function SignupViaInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!token) {
        setError('No invite token provided');
        setInviteLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invites/info/${token}`);
        const data = await response.json();

        if (!response.ok || data.status !== 'valid') {
          setError(data.error || 'Invalid or expired invite');
          setInviteLoading(false);
          return;
        }

        setInviteInfo(data);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('Failed to load invite information');
      } finally {
        setInviteLoading(false);
      }
    };

    fetchInviteInfo();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      if (!token) {
        setError('Invalid invite link');
        return;
      }

      const isValidEmail = await validateEmail(email);
      if (!isValidEmail) {
        setError('Please enter a valid email address');
        return;
      }

      const passwordError = await validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);

      // Sign up the user
      const signupData = await signUp(email, password);
      const userId = signupData.user?.id;

      if (!userId) {
        setError('Failed to create account');
        return;
      }

      // Wait a moment for the user to be created in the database
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Accept the invite and join the family
      const inviteResult = await acceptInvite(token, userId);

      if (!inviteResult.success) {
        setError(inviteResult.error || 'Failed to join family');
        return;
      }

      setSuccess('Account created and invite accepted! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (inviteLoading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-4">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Invalid Invite</h1>
        </div>
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
          <p>{error || 'This invite is no longer valid.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join {inviteInfo.name}</p>
      </div>

      <div className="mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">Joining Family:</p>
          <p className="text-base font-bold">{inviteInfo.name}</p>
          <p className="text-xs mt-2">{inviteInfo.memberCount} {inviteInfo.memberCount === 1 ? 'member' : 'members'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-200 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account & Join Family'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href={`/auth/login?redirect=/invite/${token}`} className="text-blue-400 hover:text-blue-300">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

export default function SignupViaInvitePage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md mx-auto text-center text-gray-400">Loading...</div>}>
      <SignupViaInviteContent />
    </Suspense>
  );
}
