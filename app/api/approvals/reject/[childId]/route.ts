import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rejectChild } from '@/lib/approvals';

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
