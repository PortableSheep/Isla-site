import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { requestId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return NextResponse.json({ error: 'invalid_request_id' }, { status: 400 });
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data: reqRow, error: reqErr } = await adminDb
    .from('post_review_requests')
    .select('id, post_id, status')
    .eq('id', requestId)
    .maybeSingle();
  if (reqErr) return NextResponse.json({ error: 'db_failed', detail: reqErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ error: 'review_request_not_found' }, { status: 404 });
  if (reqRow.status !== 'pending') {
    return NextResponse.json({ error: 'review_request_not_pending' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const [requestUpdate, postUpdate, auditInsert] = await Promise.all([
    adminDb
      .from('post_review_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: now,
        review_response: 'Request approved. Post moved back to pending moderation.',
        updated_at: now,
      })
      .eq('id', reqRow.id),
    adminDb
      .from('posts')
      .update({
        moderation_status: 'pending',
        rejected_by: null,
        rejected_at: null,
        rejected_reason: null,
      })
      .eq('id', reqRow.post_id),
    adminDb.from('audit_logs').insert({
      action: 'post_review_request_approved',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'post',
      subject_id: reqRow.post_id,
      reason: 'Post review request approved',
      metadata: { review_request_id: reqRow.id },
      created_at: now,
    }),
  ]);

  if (requestUpdate.error || postUpdate.error || auditInsert.error) {
    return NextResponse.json(
      {
        error: 'db_failed',
        detail:
          requestUpdate.error?.message || postUpdate.error?.message || auditInsert.error?.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
