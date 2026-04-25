import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  resolveGuest,
  isSameOriginWrite,
  isIpBanned,
  checkRateLimit,
  getIslaFamilyId,
} from '@/lib/wallGuest';
import { scoreSpam } from '@/lib/spamScore';
import { linkAttachmentsToPost } from '@/lib/wallAttachments';

export const dynamic = 'force-dynamic';

const MAX_CONTENT = 1000;

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginWrite(request)) {
      return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const rawContent: unknown = body?.content;
    const rawParent: unknown = body?.parent_post_id;
    const rawName: unknown = body?.author_name;

    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    const parentId = typeof rawParent === 'string' ? rawParent.trim() : '';

    if (!content || content.length > MAX_CONTENT) {
      return NextResponse.json({ error: 'invalid_content' }, { status: 400 });
    }
    if (!/^[0-9a-f-]{36}$/i.test(parentId)) {
      return NextResponse.json({ error: 'invalid_parent' }, { status: 400 });
    }

    const authorName =
      typeof rawName === 'string' && rawName.trim().length > 0
        ? rawName.trim().slice(0, 40)
        : 'Anonymous';

    const familyId = getIslaFamilyId();
    if (!familyId) {
      return NextResponse.json({ error: 'wall_unconfigured' }, { status: 500 });
    }

    const guest = await resolveGuest(request);

    if (await isIpBanned(guest.ip)) {
      return NextResponse.json({ error: 'banned' }, { status: 403 });
    }

    const cookieOk = await checkRateLimit('comment', `cookie:${guest.cookieId}`, 30, 3600);
    const ipOk = guest.ip
      ? await checkRateLimit('comment', `ip:${guest.ip}`, 30, 3600)
      : true;
    if (!cookieOk || !ipOk) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    // Validate parent: must exist, top-level, approved, not hidden/deleted.
    // Guests may also comment on THEIR OWN pending top-level post.
    const { data: parent, error: parentErr } = await admin
      .from('posts')
      .select('id, parent_post_id, moderation_status, deleted_at, hidden, author_cookie_id, family_id')
      .eq('id', parentId)
      .maybeSingle();

    if (parentErr) {
      return NextResponse.json(
        { error: 'db_failed', detail: parentErr.message },
        { status: 500 }
      );
    }
    if (!parent || parent.deleted_at || parent.hidden || parent.parent_post_id) {
      return NextResponse.json({ error: 'parent_invalid' }, { status: 400 });
    }
    if (parent.family_id !== familyId) {
      return NextResponse.json({ error: 'parent_invalid' }, { status: 400 });
    }
    const parentOk =
      parent.moderation_status === 'approved' ||
      parent.author_cookie_id === guest.cookieId;
    if (!parentOk) {
      return NextResponse.json({ error: 'parent_not_visible' }, { status: 403 });
    }

    const { score, reasons } = scoreSpam(content);

    // Name-in-use check: reject if this name has been used by a different cookie
    // AND a different IP in the last 24 hours. Prevents impersonation while
    // allowing the same person to reclaim their name if their cookie was cleared
    // (e.g. browser switch) but they're on the same network.
    if (authorName !== 'Anonymous') {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let nameCheckQuery = admin
        .from('posts')
        .select('id')
        .ilike('author_name', authorName)
        .neq('author_cookie_id', guest.cookieId)
        .gte('created_at', since);
      if (guest.ip) {
        nameCheckQuery = nameCheckQuery.neq('client_ip', guest.ip);
      }
      const { data: nameTaken } = await nameCheckQuery.limit(1).maybeSingle();
      if (nameTaken) {
        return NextResponse.json({ error: 'name_taken' }, { status: 409 });
      }
    }

    const { data: inserted, error } = await admin
      .from('posts')
      .insert({
        family_id: familyId,
        author_id: null,
        author_cookie_id: guest.cookieId,
        author_name: authorName,
        content,
        parent_post_id: parentId,
        client_ip: guest.ip,
        user_agent: guest.userAgent,
        spam_score: score,
        spam_reasons: reasons,
      })
      .select('id, moderation_status, created_at, parent_post_id')
      .single();

    if (error) {
      console.error('[wall/comment] insert failed', error);
      return NextResponse.json(
        { error: 'db_failed', detail: error.message },
        { status: 500 }
      );
    }

    const attachmentLinkError = await linkAttachmentsToPost(
      admin,
      body?.attachment_ids,
      inserted.id,
      guest.cookieId
    );
    if (attachmentLinkError) {
      await admin.from('posts').delete().eq('id', inserted.id);
      return NextResponse.json(
        { error: attachmentLinkError.code, detail: attachmentLinkError.detail },
        { status: attachmentLinkError.status }
      );
    }

    return NextResponse.json({ success: true, comment: inserted }, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
