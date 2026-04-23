import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuditLogs } from '@/lib/auditLog';

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

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const actor_id = searchParams.get('actor_id');
    const subject_id = searchParams.get('subject_id');
    const subject_type = searchParams.get('subject_type');
    const family_id = searchParams.get('family_id');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const filters: any = {
      limit,
      offset,
    };

    if (action) filters.action = action.split(',');
    if (actor_id) filters.actor_id = actor_id;
    if (subject_id) filters.subject_id = subject_id;
    if (subject_type) filters.subject_type = subject_type;
    if (family_id) filters.family_id = family_id;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const result = await getAuditLogs(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
