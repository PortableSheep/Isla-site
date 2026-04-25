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

export async function GET(request: Request) {
  try {
    const { supabase, user, admin } = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status') ?? 'pending';
    const allowed = ['pending', 'approved', 'rejected', 'all'] as const;
    const status = (allowed as readonly string[]).includes(statusParam)
      ? (statusParam as typeof allowed[number])
      : 'pending';

    let query = supabase
      .from('posts')
      .select(
        'id, author_id, author_name, author_cookie_id, content, parent_post_id, created_at, moderation_status, family_id, spam_score, spam_reasons, client_ip, approved_by'
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: status === 'pending' });

    if (status !== 'all') {
      query = query.eq('moderation_status', status);
    }
    if (status === 'approved' || status === 'rejected') {
      // Cap the list for the admin "retroactive removal" view.
      query = query.limit(200);
    }

    const { data: posts, error } = await query;

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

    // Fetch attachments for the posts in the queue so admins can see images.
    const postIds = (posts ?? []).map((p) => p.id);
    const attachmentsByPost: Record<
      string,
      Array<{ id: string; signed_url: string | null; mime_type: string; byte_size: number }>
    > = {};
    if (postIds.length > 0) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data: atts } = await admin
          .from('post_attachments')
          .select('id, post_id, storage_path, mime_type, byte_size')
          .in('post_id', postIds);
        const rows = atts ?? [];
        if (rows.length > 0) {
          const paths = rows.map((r) => r.storage_path);
          const { data: signed } = await admin.storage
            .from('wall-uploads')
            .createSignedUrls(paths, 600);
          const urlByPath = new Map(
            (signed ?? []).map((s) => [s.path ?? '', s.signedUrl ?? null])
          );
          for (const r of rows) {
            if (!r.post_id) continue;
            const arr = attachmentsByPost[r.post_id] ?? [];
            arr.push({
              id: r.id,
              signed_url: urlByPath.get(r.storage_path) ?? null,
              mime_type: r.mime_type,
              byte_size: r.byte_size,
            });
            attachmentsByPost[r.post_id] = arr;
          }
        }
      }
    }

    type PostRow = NonNullable<typeof posts>[number];
    const enrich = (p: PostRow) => ({
      ...p,
      author: p.author_id ? profiles[p.author_id] ?? null : null,
      kind: p.parent_post_id ? 'comment' : 'post',
      attachments: attachmentsByPost[p.id] ?? [],
    });

    return NextResponse.json({
      success: true,
      status,
      items: (posts ?? []).map(enrich),
      pending: status === 'pending' ? (posts ?? []).map(enrich) : [],
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
