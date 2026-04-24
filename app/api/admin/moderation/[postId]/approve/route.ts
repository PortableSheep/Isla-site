import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
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

    const { data: adminCheck } = await supabase.rpc('is_admin', { uid: user.id });
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId } = await params;

    const { data: updated, error } = await supabase
      .from('posts')
      .update({
        moderation_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejected_by: null,
        rejected_at: null,
        rejected_reason: null,
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
      action: 'moderation_approve',
      actor_id: user.id,
      actor_role: 'admin',
      subject_type: 'post',
      subject_id: postId,
      reason: 'Moderator approved',
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
