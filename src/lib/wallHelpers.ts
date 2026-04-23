// @ts-nocheck
import { supabase } from './supabase';

export interface AuthorInfo {
  id: string;
  email: string;
  role: 'parent' | 'child' | 'admin';
  isIslaBrand?: boolean;
}

export async function getAuthorInfo(authorId: string): Promise<AuthorInfo | null> {
  try {
    // Get user profile with role
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .eq('user_id', authorId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Get auth user email
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Failed to fetch users:', usersError);
    }

    const authUser = users?.find(u => u.id === authorId);

    // Determine role - default to child
    let role: 'parent' | 'child' | 'admin' = 'child';
    if (profileData?.role === 'parent') {
      role = 'parent';
    } else if (profileData?.role === 'admin') {
      role = 'admin';
    }

    return {
      id: authorId,
      email: authUser?.email || 'Unknown',
      role,
    };
  } catch (error) {
    console.error('Failed to fetch author info:', error);
    return null;
  }
}

// Get multiple authors efficiently
export async function getAuthorsInfo(authorIds: string[]): Promise<Map<string, AuthorInfo>> {
  try {
    const uniqueIds = Array.from(new Set(authorIds));
    const results = new Map<string, AuthorInfo>();

    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, role')
      .in('user_id', uniqueIds);

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Create role map
    const roleMap = new Map<string, string>();
    profiles?.forEach(p => {
      roleMap.set(p.user_id, p.role);
    });

    // Map results
    uniqueIds.forEach(id => {
      const role = roleMap.get(id) || 'child';
      results.set(id, {
        id,
        email: id,
        role: (role === 'parent' ? 'parent' : role === 'admin' ? 'admin' : 'child'),
      });
    });

    return results;
  } catch (error) {
    console.error('Failed to fetch authors info:', error);
    return new Map();
  }
}
