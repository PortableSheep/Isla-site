import { NextRequest, NextResponse } from 'next/server';
import { getTokenInfo } from '@/lib/inviteTokens';
import { InviteTokenResponse } from '@/types/invite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token parameter required' }, { status: 400 });
    }

    const tokenData = await getTokenInfo(token);

    if (!tokenData) {
      return NextResponse.json(
        { status: 'not_found', message: 'Token not found' } as InviteTokenResponse,
        { status: 404 }
      );
    }

    const response: InviteTokenResponse = {
      status: 'valid',
      token: tokenData,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error getting token info:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get token info' },
      { status: 500 }
    );
  }
}
