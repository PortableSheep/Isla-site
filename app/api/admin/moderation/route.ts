import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, admin: false };

  const { data: ownedFamily } = await supabase
    .from('families')
    .select('id')
    .eq('created_by', user.id)
    .limit(1)
    .maybeSingle();

  if (ownedFamily) return { supabase, user, admin: true };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return { supabase, user, admin: profile?.role === 'admin' };
}

export async function GET() {
  try {
    const { supabase, user, admin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, author_id, author_name, author_cookie_id, content, parent_post_id, created_at, moderation_status, family_id, spam_score, spam_reasons, client_ip')
      .eq('moderation_status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'db_failed', detail: error.message },
        { status: 500 }
      );
    }

    const authorIds = Array.from(
      new Set((posts ?? []).map((p) => p.author_id).filter(Boolean) as string[])
    );
    let profiles: Record<string, { name?: string; email?: string; role?: string }> = {};
    if (authorIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('user_profiles')
        .select('user_id, name, email, role')
        .in('user_id', authorIds);
      profiles = Object.fromEntries(
        (profileRows ?? []).map((p) => [
          p.user_id,
          { name: p.name, email: p.email, role: p.role },
        ])
      );
    }

    return NextResponse.json({
      success: true,
      pending: (posts ?? []).map((p) => ({
        ...p,
        author: p.author_id ? profiles[p.author_id] ?? null : null,
        kind: p.parent_post_id ? 'comment' : 'post',
      })),
    });
  } catch (err) {
    console.error('moderation queue error:', err);
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'internal_error', detail },
      { status: 500 }
    );
  }
}
