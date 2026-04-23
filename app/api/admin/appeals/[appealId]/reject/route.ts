import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  { params }: { params: Promise<{ appealId: string }> }
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

    const { appealId } = await params;
    const body = await request.json();
    const { review_response } = body;

    if (!review_response || review_response.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

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
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_response,
    };
    
    await (supabase as any)
      .from('suspension_appeals')
      .update(updateData)
      .eq('id', appealId);

    // Update user profile with rejected appeal status
    await (supabase as any)
      .from('user_profiles')
      .update({
        appeal_status: 'rejected',
      })
      .eq('user_id', appealData.user_id);

    // Log to audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        action: 'suspension_appeal_rejected',
        actor_id: user.id,
        reason: `Appeal rejected for user ${appealData.user_id}: ${review_response}`,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting appeal:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
