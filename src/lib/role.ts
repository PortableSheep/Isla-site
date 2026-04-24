import { getSbClient } from './supabaseClient';

export type SiteRole = 'admin' | 'isla' | 'friend' | 'parent' | 'child' | null;

/**
 * Returns true if the user is the "admin" of the wall. An admin is
 * anyone who has created a family, or whose profile role is 'admin'.
 * Mirrors the SQL `public.is_admin()` helper.
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const supabase = await getSbClient();
  try {
    const { data: owned } = await supabase
      .from('families')
      .select('id')
      .eq('created_by', userId)
      .limit(1)
      .maybeSingle();
    if (owned) return true;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return profile?.role === 'admin';
  } catch (err) {
    console.error('isAdminUser failed:', err);
    return false;
  }
}

export async function getUserRole(userId: string): Promise<SiteRole> {
  const supabase = await getSbClient();
  try {
    if (await isAdminUser(userId)) return 'admin';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    return (profile?.role as SiteRole) ?? null;
  } catch {
    return null;
  }
}
