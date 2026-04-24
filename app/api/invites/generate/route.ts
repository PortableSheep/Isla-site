import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createInviteToken } from '@/lib/inviteTokens';
import { CreateInviteTokenRequest, GenerateTokenResponse } from '@/types/invite';
import { sendEmail, getAppUrl } from '@/lib/email/resend';
import { inviteEmailTemplate } from '@/lib/email/templates';
import { getUserEmail } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

interface GenerateInviteBody extends CreateInviteTokenRequest {
  recipient_email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateInviteBody = await request.json();
    const expiresInDays = body.expires_in_days || 30;

    const token = await createInviteToken(user.id, body.family_id, expiresInDays);

    const appUrl = getAppUrl();
    const inviteUrl = `${appUrl}/invite/${token.token}`;

    let emailResult: { ok: boolean; skipped?: boolean; error?: string } | null = null;
    if (body.recipient_email) {
      const [inviterEmail, familyRow] = await Promise.all([
        getUserEmail(user.id),
        body.family_id
          ? supabase.from('families').select('name').eq('id', body.family_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const tpl = inviteEmailTemplate({
        inviteUrl,
        inviterName: inviterEmail ?? null,
        familyName: (familyRow?.data as { name?: string } | null)?.name ?? null,
        expiresAt: token.expires_at,
      });

      emailResult = await sendEmail({
        to: body.recipient_email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    }

    const response: GenerateTokenResponse & { invite_url: string; email?: typeof emailResult } = {
      token: token.token,
      expires_at: token.expires_at,
      invite_url: inviteUrl,
      ...(emailResult ? { email: emailResult } : {}),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error generating invite token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate token' },
      { status: 500 }
    );
  }
}

