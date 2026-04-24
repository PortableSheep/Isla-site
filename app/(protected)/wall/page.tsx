'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { WallFeed } from '@/components/wall/WallFeed';

interface FamilyData {
  id: string;
  name: string;
}

interface UserProfile {
  family_id: string;
  role: string;
  status: string;
}

interface DbError {
  code?: string;
}

export default function WallPage() {
  const { user } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>('');
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userApproved, setUserApproved] = useState(false);

  useEffect(() => {
    const fetchFamilyAndStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        // Check if user is parent or child
        const result = await supabase
          .from('user_profiles')
          .select('family_id, role, status')
          .eq('user_id', user.id)
          .maybeSingle();

        const profileError = result.error as DbError;
        const profileData = result.data as UserProfile | null;

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // If user is parent (no profile yet), they created families
        if (!profileData) {
          // Get families created by this user
          const familiesResult = await supabase
            .from('families')
            .select('id, name')
            .eq('created_by', user.id)
            .limit(1)
            .maybeSingle();

          const familiesError = familiesResult.error as DbError;
          const families = familiesResult.data as FamilyData | null;

          if (familiesError && familiesError.code !== 'PGRST116') {
            throw familiesError;
          }

          if (families) {
            setFamilyId(families.id);
            setFamilyName(families.name);
            setIsModerator(true);
            setUserApproved(true);
          }
        } else {
          // User has a profile row. Treat parent/isla/moderator roles as
          // auto-approved moderators; only child roles need explicit approval.
          const role = profileData.role;
          const isParentRole =
            role === 'parent' || role === 'isla' || role === 'moderator' || role === 'admin';

          if (profileData.family_id) {
            setFamilyId(profileData.family_id);

            if (isParentRole) {
              setIsModerator(true);
              setUserApproved(true);
            } else if (
              profileData.status === 'approved' ||
              profileData.status === 'active'
            ) {
              setUserApproved(true);
            }

            // Fetch family name
            const familyResult = await supabase
              .from('families')
              .select('name, created_by')
              .eq('id', profileData.family_id)
              .maybeSingle();

            const familyError = familyResult.error as DbError;
            const family = familyResult.data as
              | (Pick<FamilyData, 'name'> & { created_by?: string })
              | null;

            if (familyError) throw familyError;
            if (family) {
              setFamilyName(family.name);
              // Creator of the family is always a moderator + approved,
              // regardless of what role string happens to be on their profile.
              if (family.created_by === user.id) {
                setIsModerator(true);
                setUserApproved(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch family:', err);
        setError(err instanceof Error ? err.message : 'Failed to load family information');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyAndStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading wall...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-8 text-center">
          <p className="text-blue-300 mb-4">Please sign in to view the wall</p>
          <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  if (!familyId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-8 text-center">
          <p className="text-yellow-300 mb-4">No family found for your account</p>
          <p className="text-gray-400 text-sm">Please contact your family administrator</p>
        </div>
      </div>
    );
  }

  if (!userApproved) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">Awaiting Approval</h2>
          <p className="text-gray-400 mb-4">Your family administrator needs to approve your account before you can access the wall.</p>
          <p className="text-gray-500 text-sm">This typically happens within 24 hours.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-8 text-center">
          <p className="text-red-300 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white dark:from-gray-950 dark:via-purple-950 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="text-4xl">📖</div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {familyName} Wall
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share updates, memories, and connect with your family
            </p>
          </div>
        </div>

        {/* Wall Feed */}
        <WallFeed familyId={familyId} isModerator={isModerator} />
      </div>
    </div>
  );
}
