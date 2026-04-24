import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { approveChild } from '@/lib/approvals';
import { sendEmail, getAppUrl } from '@/lib/email/resend';
import { approvalEmailTemplate } from '@/lib/email/templates';
import { getUserEmail, getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;
    const { familyId } = await request.json();

    if (!childId || !familyId) {
      return NextResponse.json(
        { error: 'Missing childId or familyId' },
        { status: 400 }
      );
    }

    await approveChild(childId, familyId, user.id);

    // Best-effort approval email (doesn't block success)
    try {
      const admin = getSupabaseAdmin();
      const [{ data: profile }, { data: family }, approverEmail] = await Promise.all([
        admin
          ? admin.from('user_profiles').select('user_id').eq('id', childId).maybeSingle()
          : supabase.from('user_profiles').select('user_id').eq('id', childId).maybeSingle(),
        supabase.from('families').select('name').eq('id', familyId).maybeSingle(),
        getUserEmail(user.id),
      ]);

      const childUserId = (profile as { user_id?: string } | null)?.user_id;
      const childEmail = childUserId ? await getUserEmail(childUserId) : null;

      if (childEmail) {
        const tpl = approvalEmailTemplate({
          appUrl: getAppUrl(),
          familyName: (family as { name?: string } | null)?.name ?? null,
          approverName: approverEmail,
        });
        await sendEmail({ to: childEmail, subject: tpl.subject, html: tpl.html, text: tpl.text });
      }
    } catch (emailErr) {
      console.error('[approvals/approve] email send failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Child approved successfully',
    });
  } catch (error) {
    console.error('Error approving child:', error);
    const message = error instanceof Error ? error.message : 'Failed to approve child';
    const status = message.includes('permission') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

