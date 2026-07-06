import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 });
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const now = new Date().toISOString();
  const [profileUpdate, auditInsert] = await Promise.all([
    adminDb
      .from('user_profiles')
      .update({
        suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_reason_text: null,
        suspension_duration_days: null,
        suspension_expires_at: null,
        appeal_status: 'approved',
      })
      .eq('user_id', userId),
    adminDb.from('audit_logs').insert({
      action: 'user_unsuspended',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'user',
      subject_id: userId,
      reason: 'Moderator lifted suspension',
      created_at: now,
    }),
  ]);

  if (profileUpdate.error || auditInsert.error) {
    return NextResponse.json(
      { error: 'db_failed', detail: profileUpdate.error?.message || auditInsert.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
