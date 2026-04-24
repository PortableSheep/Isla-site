import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason: string | null =
      typeof body?.reason === 'string' && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 500)
        : null;

    const { data: updated, error } = await supabase
      .from('posts')
      .update({
        moderation_status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejected_reason: reason,
        approved_by: null,
        approved_at: null,
      })
      .eq('id', postId)
      .select('id, moderation_status')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'db_failed', detail: error.message },
        { status: 500 }
      );
    }
    if (!updated) {
      return NextResponse.json(
        { error: 'not_found_or_forbidden' },
        { status: 403 }
      );
    }

    await supabase.from('audit_logs').insert({
      action: 'moderation_reject',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'post',
      subject_id: postId,
      reason: reason ?? 'Moderator rejected',
    });

    return NextResponse.json({ success: true, post: updated });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'internal_error', detail },
      { status: 500 }
    );
  }
}
