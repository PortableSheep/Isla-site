// @ts-nocheck
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// Check if user is admin
async function isAdmin(supabase: import('@supabase/supabase-js').SupabaseClient, userId: string): Promise<boolean> {
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
  { params }: { params: Promise<{ appealId: string }> }
) {
  try {
    
    const supabase = await createClient();
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isAdmin(supabase, user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { appealId } = await params;

    // Get appeal details
    const { data: appeal, error: appealError } = await supabase
      .from('suspension_appeals')
      .select('*')
      .eq('id', appealId)
      .single();

    if (appealError || !appeal) {
      return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    const appealData = appeal as { user_id: string };

    // Update appeal status
    const updateData = {
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    await (supabase as any)
      .from('suspension_appeals')
      .update(updateData)
      .eq('id', appealId);

    // Unsuspend the user
    const { error: unsuspendError } = await (supabase as any)
      .from('user_profiles')
      .update({
        suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_reason_text: null,
        suspension_duration_days: null,
        suspension_expires_at: null,
        appeal_status: 'approved',
      })
      .eq('user_id', appealData.user_id);

    if (unsuspendError) {
      console.error('Error unsuspending user:', unsuspendError);
      return NextResponse.json(
        { error: 'Failed to unsuspend user' },
        { status: 500 }
      );
    }

    // Log to audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        action: 'suspension_appeal_approved',
        actor_id: user.id,
        reason: `Appeal approved for user ${appealData.user_id}`,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving appeal:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
