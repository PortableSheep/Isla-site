import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getUserPreferences, savePreferences } from '@/lib/notificationPrefs';
import { NotificationPreferencesInput } from '@/types/notifications';

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

    const prefs = await getUserPreferences(user.id);
    return NextResponse.json(prefs);
  } catch (err) {
    console.error('GET /api/users/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: NotificationPreferencesInput = await request.json();
    const saved = await savePreferences(user.id, body);
    return NextResponse.json(saved);
  } catch (err) {
    console.error('PUT /api/users/notifications error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
