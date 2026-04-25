import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { readAuthorCookieId, getIslaFamilyId } from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'wall-uploads';
const SIGNED_URL_TTL = 600; // 10 minutes

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

type FeedAttachment = {
  id: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  signed_url: string | null;
};

type FeedPost = Omit<WallPost, 'author_cookie_id'> & {
  reactions: Record<string, number>;
  my_reactions: string[];
  comments: (Omit<WallPost, 'author_cookie_id'> & { attachments: FeedAttachment[] })[];
  attachments: FeedAttachment[];
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
    const before = searchParams.get('before') ?? null;

    // Top-level posts: approved OR caller's own pending/rejected.
    const filter = cookieId
      ? `moderation_status.eq.approved,author_cookie_id.eq.${cookieId}`
      : `moderation_status.eq.approved`;

    let query = admin
      .from('posts')
      .select('id, parent_post_id, author_name, author_cookie_id, content, moderation_status, created_at')
      .is('parent_post_id', null)
      .is('deleted_at', null)
      .eq('hidden', false)
      .eq('family_id', familyId)
      .or(filter)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: topRows, error: topErr } = await query;

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

    // Attachments: pull rows for every post/comment in this feed, then mint
    // signed URLs only for rows whose owning row is approved OR belongs to
    // the caller. Pending posts owned by strangers come back with
    // signed_url=null so the UI can hide them the same way it hides text
    // embeds pre-approval.
    const allPostIds = [
      ...(topRows ?? []).map((p) => p.id),
      ...commentRows.map((c) => c.id),
    ];
    const approvalById = new Map<string, 'pending' | 'approved' | 'rejected'>();
    const ownerCookieById = new Map<string, string | null>();
    for (const p of topRows ?? []) {
      approvalById.set(p.id, p.moderation_status);
      ownerCookieById.set(p.id, p.author_cookie_id);
    }
    for (const c of commentRows) {
      approvalById.set(c.id, c.moderation_status);
      ownerCookieById.set(c.id, c.author_cookie_id);
    }

    const attachmentsByPost = new Map<string, FeedAttachment[]>();
    if (allPostIds.length > 0) {
      const { data: aRows, error: aErr } = await admin
        .from('post_attachments')
        .select('id, post_id, storage_path, mime_type, width, height')
        .in('post_id', allPostIds);
      if (aErr) {
        return NextResponse.json(
          { error: 'db_failed', detail: aErr.message },
          { status: 500 }
        );
      }

      const signable = (aRows ?? []).filter((a) => {
        const status = approvalById.get(a.post_id!);
        const owner = ownerCookieById.get(a.post_id!);
        const isMine = Boolean(cookieId && owner === cookieId);
        return status === 'approved' || isMine;
      });

      if (signable.length > 0) {
        const { data: signed, error: signErr } = await admin.storage
          .from(STORAGE_BUCKET)
          .createSignedUrls(
            signable.map((a) => a.storage_path),
            SIGNED_URL_TTL
          );
        if (signErr) {
          console.error('[wall/feed] createSignedUrls failed', signErr);
        }
        const urlByPath = new Map<string, string | null>();
        for (const s of signed ?? []) {
          urlByPath.set(s.path ?? '', s.signedUrl ?? null);
        }
        for (const a of aRows ?? []) {
          const status = approvalById.get(a.post_id!);
          const owner = ownerCookieById.get(a.post_id!);
          const isMine = Boolean(cookieId && owner === cookieId);
          const canSee = status === 'approved' || isMine;
          const bucket = attachmentsByPost.get(a.post_id!) ?? [];
          bucket.push({
            id: a.id,
            mime_type: a.mime_type,
            width: a.width,
            height: a.height,
            signed_url: canSee ? urlByPath.get(a.storage_path) ?? null : null,
          });
          attachmentsByPost.set(a.post_id!, bucket);
        }
      } else {
        for (const a of aRows ?? []) {
          const bucket = attachmentsByPost.get(a.post_id!) ?? [];
          bucket.push({
            id: a.id,
            mime_type: a.mime_type,
            width: a.width,
            height: a.height,
            signed_url: null,
          });
          attachmentsByPost.set(a.post_id!, bucket);
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
        attachments: attachmentsByPost.get(p.id) ?? [],
        comments: commentRows
          .filter((c) => c.parent_post_id === p.id)
          .map((c) => ({
            ...strip(c),
            attachments: attachmentsByPost.get(c.id) ?? [],
          })),
      };
    });

    return NextResponse.json({ success: true, feed });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
