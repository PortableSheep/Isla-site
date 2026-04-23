import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getChildrenByParent } from '@/lib/childProfiles';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const children = await getChildrenByParent(user.id);

    return NextResponse.json(children, { status: 200 });
  } catch (error) {
    console.error('Error fetching children:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch children';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
