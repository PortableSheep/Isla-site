import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Convenience: ban the IP that authored a given post. Creates a /32 CIDR.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { postId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(postId)) {
    return NextResponse.json({ error: 'invalid_post' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const reason: string | null = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : null;

  const adminDb = getSupabaseAdmin();
  if (!adminDb) return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });

  const { data: post, error: postErr } = await adminDb
    .from('posts')
    .select('client_ip')
    .eq('id', postId)
    .maybeSingle();
  if (postErr) return NextResponse.json({ error: 'db_failed', detail: postErr.message }, { status: 500 });
  if (!post?.client_ip) return NextResponse.json({ error: 'no_ip_on_post' }, { status: 404 });

  const ip = String(post.client_ip);
  const cidr = ip.includes(':') ? `${ip}/128` : `${ip}/32`;

  const { data: ban, error: banErr } = await adminDb
    .from('ip_bans')
    .insert({ cidr, reason, created_by: user.id })
    .select('id, cidr, reason, created_at')
    .single();
  if (banErr) return NextResponse.json({ error: 'db_failed', detail: banErr.message }, { status: 400 });

  return NextResponse.json({ ban }, { status: 201 });
}
