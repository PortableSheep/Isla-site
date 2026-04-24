import { getMyFamilies } from '@/lib/inviteFlow';
import { createClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    
    const supabase = await createClient();
    // Get the current user
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

    const families = await getMyFamilies(user.id);

    return NextResponse.json({
      success: true,
      families,
    });
  } catch (error) {
    console.error('Error fetching user families:', error);
    return NextResponse.json(
      { error: 'Failed to fetch families' },
      { status: 500 }
    );
  }
}
