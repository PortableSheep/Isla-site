import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getUnreadCount } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(user.id);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('GET /api/notifications/unread-count error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
