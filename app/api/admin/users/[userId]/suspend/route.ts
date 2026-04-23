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
    const body = await request.json();
    const { reason, reason_text, duration_days } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Suspension reason is required' },
        { status: 400 }
      );
    }

    // Calculate suspension expiry
    const now = new Date();
    const expiresAt = duration_days
      ? new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Update user profile with suspension
    const { error: updateError } = await (supabase as any)
      .from('user_profiles')
      .update({
        suspended: true,
        suspended_at: now.toISOString(),
        suspended_by: user.id,
        suspension_reason: reason,
        suspension_reason_text: reason_text || null,
        suspension_duration_days: duration_days || null,
        suspension_expires_at: expiresAt,
        appeal_status: 'none',
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error suspending user:', updateError);
      return NextResponse.json(
        { error: 'Failed to suspend user' },
        { status: 500 }
      );
    }

    // Log to audit trail
    const auditReason = `Suspended for: ${reason}${reason_text ? ` - ${reason_text}` : ''}${duration_days ? ` - ${duration_days} days` : ' - Permanent'}`;
    logAction(
      'user_suspended',
      user.id,
      'user',
      userId,
      auditReason,
      {
        reason,
        reason_text,
        duration_days,
        suspension_expires_at: expiresAt,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error suspending user:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
