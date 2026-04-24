import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, admin: false };
  const { data } = await supabase.rpc('is_admin', { uid: user.id });
  return { user, admin: Boolean(data) };
}

export async function GET() {
  const { user, admin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  const { data, error } = await adminDb
    .from('ip_bans')
    .select('id, cidr, reason, created_by, created_at, expires_at')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: 'db_failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ bans: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { user, admin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const rawCidr: unknown = body?.cidr;
  const rawReason: unknown = body?.reason;
  const rawExpires: unknown = body?.expires_at;

  if (typeof rawCidr !== 'string' || rawCidr.trim().length === 0) {
    return NextResponse.json({ error: 'invalid_cidr' }, { status: 400 });
  }
  const cidr = rawCidr.trim();
  // Basic sanity — Postgres will reject malformed CIDR, but a quick regex avoids a round trip.
  if (!/^[0-9a-f.:/]+$/i.test(cidr)) {
    return NextResponse.json({ error: 'invalid_cidr' }, { status: 400 });
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  const { data, error } = await adminDb
    .from('ip_bans')
    .insert({
      cidr,
      reason: typeof rawReason === 'string' ? rawReason.slice(0, 500) : null,
      created_by: user.id,
      expires_at:
        typeof rawExpires === 'string' && rawExpires.length > 0 ? rawExpires : null,
    })
    .select('id, cidr, reason, created_at, expires_at')
    .single();
  if (error) {
    return NextResponse.json({ error: 'db_failed', detail: error.message }, { status: 400 });
  }
  return NextResponse.json({ ban: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { user, admin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  }

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  const { error } = await adminDb.from('ip_bans').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'db_failed', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
