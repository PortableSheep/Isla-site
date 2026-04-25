import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { markAllAsRead } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await markAllAsRead(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/notifications/read-all error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
