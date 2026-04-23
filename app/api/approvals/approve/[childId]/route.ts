import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { approveChild } from '@/lib/approvals';

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
    const { familyId } = await request.json();

    if (!childId || !familyId) {
      return NextResponse.json(
        { error: 'Missing childId or familyId' },
        { status: 400 }
      );
    }

    await approveChild(childId, familyId, user.id);

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
