import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminInstance: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Server-only — never import into client bundles.
 * Returns null if the service role key isn't configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminInstance) return adminInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable.');
    return null;
  }

  adminInstance = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminInstance;
}

/** Resolve an auth.users.email given a user id (uuid). */
export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch {
    return null;
  }
}
