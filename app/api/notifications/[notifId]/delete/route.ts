import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { deleteNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ notifId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notifId } = await params;
    await deleteNotification(notifId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/notifications/[notifId]/delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
