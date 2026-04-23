import { getInviteInfo } from '@/lib/inviteFlow';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const inviteInfo = await getInviteInfo(token);

    return NextResponse.json(inviteInfo);
  } catch (error) {
    console.error('Error fetching invite info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite information' },
      { status: 500 }
    );
  }
}
