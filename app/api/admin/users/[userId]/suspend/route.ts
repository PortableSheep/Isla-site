import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { SuspensionReason } from '@/types/suspension';

export const dynamic = 'force-dynamic';

const ALLOWED_REASONS: ReadonlySet<SuspensionReason> = new Set([
  'spam',
  'harassment',
  'multiple_violations',
  'other',
]);

export async function POST(
  request: NextRequest,
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

  const body = await request.json().catch(() => null);
  const rawReason: unknown = body?.reason;
  const rawReasonText: unknown = body?.reason_text;
  const rawDurationDays: unknown = body?.duration_days;
  if (typeof rawReason !== 'string' || !ALLOWED_REASONS.has(rawReason as SuspensionReason)) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 });
  }
  const reasonText = typeof rawReasonText === 'string' ? rawReasonText.trim().slice(0, 500) : null;
  const durationDays =
    typeof rawDurationDays === 'number' && Number.isFinite(rawDurationDays)
      ? Math.max(1, Math.floor(rawDurationDays))
      : null;
  const now = new Date();
  const expiresAt = durationDays ? new Date(now.getTime() + durationDays * 86400000).toISOString() : null;

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const [profileUpdate, auditInsert] = await Promise.all([
    adminDb
      .from('user_profiles')
      .update({
        suspended: true,
        suspended_at: now.toISOString(),
        suspended_by: user.id,
        suspension_reason: rawReason,
        suspension_reason_text: reasonText,
        suspension_duration_days: durationDays,
        suspension_expires_at: expiresAt,
        appeal_status: 'none',
        appeal_submitted_at: null,
      })
      .eq('user_id', userId),
    adminDb.from('audit_logs').insert({
      action: 'user_suspended',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'user',
      subject_id: userId,
      reason: reasonText ?? `User suspended: ${rawReason}`,
      created_at: now.toISOString(),
      metadata: { duration_days: durationDays, suspension_reason: rawReason },
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
