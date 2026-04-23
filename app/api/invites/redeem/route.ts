import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { redeemToken, validateToken } from '@/lib/inviteTokens';
import { RedeemTokenRequest } from '@/types/invite';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RedeemTokenRequest = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const validation = await validateToken(token);
    if (!validation.isValid) {
      if (validation.reason === 'Token already redeemed') {
        return NextResponse.json({ error: validation.reason }, { status: 409 });
      } else if (validation.reason === 'Token expired') {
        return NextResponse.json({ error: validation.reason }, { status: 410 });
      } else {
        return NextResponse.json({ error: validation.reason }, { status: 404 });
      }
    }

    const redeemedToken = await redeemToken(token, user.id);

    return NextResponse.json(
      {
        message: 'Token redeemed successfully',
        token: redeemedToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error redeeming token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to redeem token' },
      { status: 500 }
    );
  }
}
