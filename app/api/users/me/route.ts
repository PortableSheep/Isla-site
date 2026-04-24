import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('family_id, role, status')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  });
}
