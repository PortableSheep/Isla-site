import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Perform the queries directly on the already-authenticated server
    // client. Using a second (universal) client here has caused RLS to
    // miss the user in some Vercel builds.
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('family_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileErr) {
      console.error('my-families: user_profiles query failed', profileErr);
      return NextResponse.json(
        { error: 'profile_query_failed', detail: profileErr.message },
        { status: 500 }
      );
    }

    if (!profile?.family_id) {
      return NextResponse.json({ success: true, userId: user.id, families: [] });
    }

    const { data: family, error: famErr } = await supabase
      .from('families')
      .select('id, name')
      .eq('id', profile.family_id)
      .maybeSingle();

    if (famErr) {
      console.error('my-families: families query failed', famErr);
      return NextResponse.json(
        { error: 'family_query_failed', detail: famErr.message },
        { status: 500 }
      );
    }

    if (!family) {
      return NextResponse.json({ success: true, userId: user.id, families: [] });
    }

    const { count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', profile.family_id)
      .eq('status', 'approved');

    return NextResponse.json({
      success: true,
      userId: user.id,
      families: [
        {
          id: family.id,
          name: family.name,
          memberCount: count || 0,
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching user families:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to fetch families', detail: message },
      { status: 500 }
    );
  }
}
