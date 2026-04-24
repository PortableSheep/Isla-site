import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rejectChild } from '@/lib/approvals';
import { sendEmail, getAppUrl } from '@/lib/email/resend';
import { rejectionEmailTemplate } from '@/lib/email/templates';
import { getSupabaseAdmin, getUserEmail } from '@/lib/supabaseAdmin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;
    const { familyId, reason } = await request.json();

    if (!childId || !familyId) {
      return NextResponse.json(
        { error: 'Missing childId or familyId' },
        { status: 400 }
      );
    }

    await rejectChild(childId, familyId, user.id, reason);

    try {
      const admin = getSupabaseAdmin();
      const { data: profile } = await (admin
        ? admin.from('user_profiles').select('user_id').eq('id', childId).maybeSingle()
        : supabase.from('user_profiles').select('user_id').eq('id', childId).maybeSingle());
      const childUserId = (profile as { user_id?: string } | null)?.user_id;
      const childEmail = childUserId ? await getUserEmail(childUserId) : null;

      if (childEmail) {
        const tpl = rejectionEmailTemplate({ appUrl: getAppUrl(), reason: reason ?? null });
        await sendEmail({ to: childEmail, subject: tpl.subject, html: tpl.html, text: tpl.text });
      }
    } catch (emailErr) {
      console.error('[approvals/reject] email send failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Child rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting child:', error);
    const message = error instanceof Error ? error.message : 'Failed to reject child';
    const status = message.includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

