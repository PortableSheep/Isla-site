import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, admin: false };
  const { data } = await supabase.rpc('is_admin', { uid: user.id });
  return { user, admin: Boolean(data) };
}

export async function GET() {
  const { user, admin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data, error } = await adminDb
    .from('post_review_requests')
    .select(
      'id, post_id, requester_user_id, requester_cookie_id, request_message, status, reviewed_by, reviewed_at, review_response, created_at, updated_at, posts!inner(id, content, author_name, moderation_status, created_at)'
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: 'db_failed', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
