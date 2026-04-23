import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is suspended
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('suspended, appeal_status')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!(profile as { suspended: boolean }).suspended) {
      return NextResponse.json(
        { error: 'User is not suspended' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { appeal_text } = body;

    if (!appeal_text || appeal_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Appeal text is required' },
        { status: 400 }
      );
    }

    if (appeal_text.length > 2000) {
      return NextResponse.json(
        { error: 'Appeal text cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Check if user has pending appeal
    const { data: existingAppeal } = await supabase
      .from('suspension_appeals')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingAppeal) {
      return NextResponse.json(
        { error: 'You already have a pending appeal' },
        { status: 400 }
      );
    }

    // Create appeal record
    const { data: appeal, error: createError } = await (supabase as any)
      .from('suspension_appeals')
      .insert({
        user_id: user.id,
        appeal_text,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating appeal:', createError);
      return NextResponse.json(
        { error: 'Failed to submit appeal' },
        { status: 500 }
      );
    }

    // Update user profile with pending appeal status
    await (supabase as any)
      .from('user_profiles')
      .update({
        appeal_status: 'pending',
        appeal_submitted_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Log to audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        action: 'suspension_appeal_submitted',
        actor_id: user.id,
        reason: 'User submitted suspension appeal',
      });

    return NextResponse.json({ success: true, appeal });
  } catch (error) {
    console.error('Error submitting appeal:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
