import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getModerationStats } from '@/lib/moderation';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return (data as { role: string } | null)?.role === 'admin';
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

export async function GET() {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await getModerationStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching moderation statistics:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
