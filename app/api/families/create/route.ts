import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = (body.name || '').trim();
  if (!name) {
    return NextResponse.json(
      { error: 'Family name is required' },
      { status: 400 }
    );
  }
  if (name.length > 255) {
    return NextResponse.json(
      { error: 'Family name is too long' },
      { status: 400 }
    );
  }

  // user_profiles.user_id is UNIQUE — a user can only belong to one family.
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('family_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing?.family_id) {
    return NextResponse.json(
      { error: 'You already belong to a family' },
      { status: 400 }
    );
  }

  const { data: family, error: famError } = await supabase
    .from('families')
    .insert({ name, created_by: user.id })
    .select('id, name')
    .single();

  if (famError || !family) {
    console.error('Failed to create family:', famError);
    return NextResponse.json(
      { error: famError?.message || 'Failed to create family' },
      { status: 500 }
    );
  }

  const profileResult = existing
    ? await supabase
        .from('user_profiles')
        .update({
          family_id: family.id,
          role: 'admin',
          status: 'approved',
        })
        .eq('user_id', user.id)
    : await supabase.from('user_profiles').insert({
        user_id: user.id,
        family_id: family.id,
        role: 'admin',
        status: 'approved',
      });

  if (profileResult.error) {
    console.error('Failed to link profile:', profileResult.error);
    await supabase.from('families').delete().eq('id', family.id);
    return NextResponse.json(
      { error: 'Failed to create family profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, family });
}
