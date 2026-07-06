import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { AI_THRESHOLD_SETTING_KEYS } from '@/lib/moderationThresholds';

export const dynamic = 'force-dynamic';

/** Verify the requesting user is an admin via the Supabase `is_admin` RPC. */
async function assertAdmin(request: NextRequest): Promise<{ userId: string } | null> {
  const cookieStore = request.cookies;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
  if (!isAdmin) return null;
  return { userId: user.id };
}

/** GET /api/admin/settings — returns all site settings as { key: value } */
export async function GET(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data, error } = await db.from('site_settings').select('key, value');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return NextResponse.json({ settings });
}

/** POST /api/admin/settings — update a single setting { key, value } */
export async function POST(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  const value = typeof body?.value === 'string' ? body.value : '';

  const updatesFromMap =
    body && typeof body === 'object' && body.updates && typeof body.updates === 'object'
      ? Object.entries(body.updates as Record<string, unknown>)
          .filter(([mapKey, mapValue]) => typeof mapKey === 'string' && typeof mapValue === 'string')
          .map(([mapKey, mapValue]) => ({ key: mapKey.trim(), value: mapValue as string }))
          .filter((entry) => entry.key.length > 0)
      : [];

  const updates = updatesFromMap.length > 0 ? updatesFromMap : key ? [{ key, value }] : [];
  if (updates.length === 0) {
    return NextResponse.json({ error: 'invalid_key' }, { status: 400 });
  }

  for (const entry of updates) {
    if (!AI_THRESHOLD_SETTING_KEYS.includes(entry.key)) continue;
    const parsed = Number(entry.value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      return NextResponse.json(
        { error: 'invalid_threshold', key: entry.key, detail: 'threshold must be between 0 and 1' },
        { status: 400 }
      );
    }
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { error } = await db
    .from('site_settings')
    .upsert(
      updates.map((entry) => ({
        key: entry.key,
        value: entry.value,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'key' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    updated: updates.length,
    settings: Object.fromEntries(updates.map((entry) => [entry.key, entry.value])),
  });
}
