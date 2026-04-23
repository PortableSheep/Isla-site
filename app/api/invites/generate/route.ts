import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createInviteToken } from '@/lib/inviteTokens';
import { CreateInviteTokenRequest, GenerateTokenResponse } from '@/types/invite';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateInviteTokenRequest = await request.json();
    const expiresInDays = body.expires_in_days || 30;

    const token = await createInviteToken(user.id, body.family_id, expiresInDays);

    const response: GenerateTokenResponse = {
      token: token.token,
      expires_at: token.expires_at,
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
