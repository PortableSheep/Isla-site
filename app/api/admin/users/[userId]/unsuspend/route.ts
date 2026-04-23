import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/auditLog';

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
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params;

    // Clear suspension from user profile
    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({
        suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_reason_text: null,
        suspension_duration_days: null,
        suspension_expires_at: null,
        appeal_status: 'none',
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error unsuspending user:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsuspend user' },
        { status: 500 }
      );
    }

    // Log to audit trail
    logAction(
      'user_unsuspended',
      user.id,
      'user',
      userId,
      'User suspension lifted'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
