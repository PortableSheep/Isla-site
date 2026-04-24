import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { readAuthorCookieId, getIslaFamilyId } from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

type WallPost = {
  id: string;
  parent_post_id: string | null;
  author_name: string | null;
  author_cookie_id: string | null;
  content: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  is_mine: boolean;
};

type FeedPost = Omit<WallPost, 'author_cookie_id'> & {
  reactions: Record<string, number>;
  my_reactions: string[];
  comments: Omit<WallPost, 'author_cookie_id'>[];
};

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }
    const familyId = getIslaFamilyId();
    if (!familyId) {
      return NextResponse.json({ error: 'wall_unconfigured' }, { status: 500 });
    }

    const cookieId = await readAuthorCookieId();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10) || 30, 1), 100);

    // Top-level posts: approved OR caller's own pending/rejected.
    const filter = cookieId
      ? `moderation_status.eq.approved,author_cookie_id.eq.${cookieId}`
      : `moderation_status.eq.approved`;

    const { data: topRows, error: topErr } = await admin
      .from('posts')
      .select('id, parent_post_id, author_name, author_cookie_id, content, moderation_status, created_at')
      .is('parent_post_id', null)
      .is('deleted_at', null)
      .eq('hidden', false)
      .eq('family_id', familyId)
      .or(filter)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (topErr) {
      return NextResponse.json(
        { error: 'db_failed', detail: topErr.message },
        { status: 500 }
      );
    }

    const postIds = (topRows ?? []).map((p) => p.id);

    // Comments: approved OR own pending, whose parent is in our returned set.
    let commentRows: Array<WallPost> = [];
    if (postIds.length > 0) {
      const { data: cRows, error: cErr } = await admin
        .from('posts')
        .select('id, parent_post_id, author_name, author_cookie_id, content, moderation_status, created_at')
        .in('parent_post_id', postIds)
        .is('deleted_at', null)
        .eq('hidden', false)
        .or(filter)
        .order('created_at', { ascending: true });
      if (cErr) {
        return NextResponse.json(
          { error: 'db_failed', detail: cErr.message },
          { status: 500 }
        );
      }
      commentRows = (cRows ?? []).map((r) => ({
        ...r,
        is_mine: Boolean(cookieId && r.author_cookie_id === cookieId),
      })) as WallPost[];
    }

    // Reactions on approved top-level posts only
    const approvedIds = (topRows ?? [])
      .filter((p) => p.moderation_status === 'approved')
      .map((p) => p.id);

    const reactionsByPost = new Map<string, Record<string, number>>();
    const myReactionsByPost = new Map<string, Set<string>>();
    if (approvedIds.length > 0) {
      const { data: rRows } = await admin
        .from('post_reactions')
        .select('post_id, emoji, author_cookie_id, user_id')
        .in('post_id', approvedIds);
      for (const r of rRows ?? []) {
        const bucket = reactionsByPost.get(r.post_id) ?? {};
        bucket[r.emoji] = (bucket[r.emoji] ?? 0) + 1;
        reactionsByPost.set(r.post_id, bucket);
        if (cookieId && r.author_cookie_id === cookieId) {
          const mine = myReactionsByPost.get(r.post_id) ?? new Set<string>();
          mine.add(r.emoji);
          myReactionsByPost.set(r.post_id, mine);
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const strip = ({ author_cookie_id: _c, ...rest }: WallPost) => rest;

    const feed: FeedPost[] = (topRows ?? []).map((p) => {
      const withMine: WallPost = {
        ...p,
        is_mine: Boolean(cookieId && p.author_cookie_id === cookieId),
      } as WallPost;
      return {
        ...strip(withMine),
        reactions: reactionsByPost.get(p.id) ?? {},
        my_reactions: Array.from(myReactionsByPost.get(p.id) ?? []),
        comments: commentRows
          .filter((c) => c.parent_post_id === p.id)
          .map(strip),
      };
    });

    return NextResponse.json({ success: true, feed });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
