import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { updateFlagStatus } from '@/lib/moderation';
import { FlagStatus } from '@/types/moderation';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
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

    const { flagId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'reviewed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updated = await updateFlagStatus(flagId, status as FlagStatus);

    if (!updated) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating flag status:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
