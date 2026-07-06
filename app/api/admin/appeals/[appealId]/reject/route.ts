import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_REVIEW_RESPONSE = 500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appealId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { appealId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(appealId)) {
    return NextResponse.json({ error: 'invalid_appeal_id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const rawResponse: unknown = body?.review_response;
  const reviewResponse = typeof rawResponse === 'string' ? rawResponse.trim() : '';
  if (!reviewResponse) {
    return NextResponse.json({ error: 'review_response_required' }, { status: 400 });
  }
  if (reviewResponse.length > MAX_REVIEW_RESPONSE) {
    return NextResponse.json(
      { error: 'review_response_too_long', detail: `Must be <= ${MAX_REVIEW_RESPONSE} chars` },
      { status: 400 }
    );
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data: appeal, error: appealErr } = await adminDb
    .from('suspension_appeals')
    .select('id, user_id, status')
    .eq('id', appealId)
    .maybeSingle();
  if (appealErr) {
    return NextResponse.json({ error: 'db_failed', detail: appealErr.message }, { status: 500 });
  }
  if (!appeal) return NextResponse.json({ error: 'appeal_not_found' }, { status: 404 });
  if (appeal.status !== 'pending') {
    return NextResponse.json({ error: 'appeal_not_pending' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const [appealUpdate, profileUpdate, auditInsert] = await Promise.all([
    adminDb
      .from('suspension_appeals')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
        review_response: reviewResponse,
        updated_at: now,
      })
      .eq('id', appeal.id),
    adminDb
      .from('user_profiles')
      .update({
        appeal_status: 'rejected',
      })
      .eq('user_id', appeal.user_id),
    adminDb.from('audit_logs').insert({
      action: 'appeal_rejected',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'user',
      subject_id: appeal.user_id,
      reason: reviewResponse,
      created_at: now,
      metadata: { appeal_id: appeal.id },
    }),
  ]);

  if (appealUpdate.error || profileUpdate.error || auditInsert.error) {
    return NextResponse.json(
      {
        error: 'db_failed',
        detail:
          appealUpdate.error?.message || profileUpdate.error?.message || auditInsert.error?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
