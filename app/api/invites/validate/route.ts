import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/inviteTokens';
import { InviteTokenResponse } from '@/types/invite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token parameter required' }, { status: 400 });
    }

    const validation = await validateToken(token);

    if (!validation.isValid) {
      const response: InviteTokenResponse = {
        status: validation.reason === 'Token expired' ? 'expired' : validation.reason === 'Token already redeemed' ? 'redeemed' : validation.reason === 'Token not found' ? 'not_found' : 'invalid',
        message: validation.reason,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: InviteTokenResponse = {
      status: 'valid',
      token: validation.tokenData,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate token' },
      { status: 500 }
    );
  }
}
