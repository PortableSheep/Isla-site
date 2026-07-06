import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const MAX_APPEAL_TEXT = 2000;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const [{ data: profile, error: profileErr }, { data: appeals, error: appealErr }] =
    await Promise.all([
      adminDb
        .from('user_profiles')
        .select('suspended, appeal_status, appeal_submitted_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      adminDb
        .from('suspension_appeals')
        .select(
          'id, user_id, appeal_text, status, reviewed_by, reviewed_at, review_response, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

  if (profileErr || appealErr) {
    return NextResponse.json(
      { error: 'db_failed', detail: profileErr?.message || appealErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    suspension: profile ?? null,
    previousAppeal: appeals?.[0] ?? null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const rawAppealText: unknown = body?.appeal_text;
  const appealText = typeof rawAppealText === 'string' ? rawAppealText.trim() : '';
  if (!appealText) return NextResponse.json({ error: 'invalid_appeal_text' }, { status: 400 });
  if (appealText.length > MAX_APPEAL_TEXT) {
    return NextResponse.json(
      { error: 'appeal_too_long', detail: `Appeal must be <= ${MAX_APPEAL_TEXT} characters` },
      { status: 400 }
    );
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data: profile, error: profileErr } = await adminDb
    .from('user_profiles')
    .select('suspended, appeal_status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileErr) {
    return NextResponse.json({ error: 'db_failed', detail: profileErr.message }, { status: 500 });
  }
  if (!profile?.suspended) {
    return NextResponse.json({ error: 'not_suspended' }, { status: 400 });
  }

  const { data: existingPending, error: pendingErr } = await adminDb
    .from('suspension_appeals')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();
  if (pendingErr) {
    return NextResponse.json({ error: 'db_failed', detail: pendingErr.message }, { status: 500 });
  }
  if (existingPending) {
    return NextResponse.json(
      { error: 'appeal_already_pending', submitted_at: existingPending.created_at },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertErr } = await adminDb
    .from('suspension_appeals')
    .insert({
      user_id: user.id,
      appeal_text: appealText,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select(
      'id, user_id, appeal_text, status, reviewed_by, reviewed_at, review_response, created_at, updated_at'
    )
    .single();
  if (insertErr) {
    return NextResponse.json({ error: 'db_failed', detail: insertErr.message }, { status: 500 });
  }

  await Promise.all([
    adminDb
      .from('user_profiles')
      .update({
        appeal_status: 'pending',
        appeal_submitted_at: now,
      })
      .eq('user_id', user.id),
    adminDb.from('audit_logs').insert({
      action: 'appeal_submitted',
      actor_id: user.id,
      actor_role: 'parent',
      subject_type: 'user',
      subject_id: user.id,
      reason: 'User submitted suspension appeal',
      created_at: now,
    }),
  ]);

  return NextResponse.json({ success: true, appeal: inserted }, { status: 201 });
}
