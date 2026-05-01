import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, admin: false };

  // Check if they own a family (default admin check)
  const { data: ownedFamily } = await supabase
    .from('families')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .maybeSingle();

  if (ownedFamily) return { supabase, user, admin: true };

  // Check profile role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return { supabase, user, admin: profile?.role === 'admin' };
}

export async function GET(request: Request) {
  try {
    const { user, admin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const ip = url.searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ error: 'Missing IP' }, { status: 400 });
    }

    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Fetch distinct names used by this IP
    const { data, error } = await adminClient
      .from('posts')
      .select('author_name')
      .eq('client_ip', ip)
      .not('author_name', 'is', null);

    if (error) {
      return NextResponse.json(
        { error: 'Database failed', detail: error.message },
        { status: 500 }
      );
    }

    const names = Array.from(new Set((data ?? []).map((r) => r.author_name))).sort();

    return NextResponse.json({ ip, names });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Internal server error', detail }, { status: 500 });
  }
}
