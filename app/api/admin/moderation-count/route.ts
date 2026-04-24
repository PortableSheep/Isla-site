import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Admin-only: how many posts/comments are waiting for moderation?
 * Used by the nav badge to surface a queue size without scraping the
 * full dashboard. Cheap head-count query.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', {
    uid: user.id,
  });
  if (isAdminError || isAdminData !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'service_role_unavailable' }, { status: 503 });
  }

  const { count, error } = await admin
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('moderation_status', 'pending')
    .is('deleted_at', null);

  if (error) {
    console.error('[moderation-count] query failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
