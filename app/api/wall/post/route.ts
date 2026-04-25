import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSbClient } from '@/lib/supabaseClient';
import {
  resolveGuest,
  isSameOriginWrite,
  isIpBanned,
  checkRateLimit,
  getIslaFamilyId,
} from '@/lib/wallGuest';
import { scoreSpam } from '@/lib/spamScore';
import { moderateContent } from '@/lib/contentModeration';
import { checkUrls } from '@/lib/urlSafety';
import { linkAttachmentsToPost } from '@/lib/wallAttachments';
import { sendPushToAll } from '@/lib/webPush';

export const dynamic = 'force-dynamic';

const MAX_CONTENT = 2000;

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginWrite(request)) {
      return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const rawContent: unknown = body?.content;
    const rawName: unknown = body?.author_name;

    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!content || content.length > MAX_CONTENT) {
      return NextResponse.json({ error: 'invalid_content' }, { status: 400 });
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

    // If the visitor signed in via the wall's magic-link flow, attach
    // their auth user id so the feed can mark the post as verified.
    let authUserId: string | null = null;
    try {
      const sb = await getSbClient();
      const { data: userResp } = await sb.auth.getUser();
      authUserId = userResp.user?.id ?? null;
    } catch {
      authUserId = null;
    }

    if (await isIpBanned(guest.ip)) {
      return NextResponse.json({ error: 'banned' }, { status: 403 });
    }

    const cookieOk = await checkRateLimit('post', `cookie:${guest.cookieId}`, 10, 3600);
    const ipOk = guest.ip
      ? await checkRateLimit('post', `ip:${guest.ip}`, 10, 3600)
      : true;
    if (!cookieOk || !ipOk) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const { score, reasons } = scoreSpam(content);

    // AI moderation (3 s timeout, fail open) + URL safety check.
    // Both checks inject tags into spam_reasons; the DB trigger forces
    // moderation_status = 'pending' when any block-tag is present.
    const [aiResult, urlResult] = await Promise.all([
      moderateContent(content),
      Promise.resolve(checkUrls(content)),
    ]);
    const allReasons = [...reasons, ...aiResult.reasons, ...urlResult.reasons];

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

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
        author_id: authUserId,
        author_cookie_id: guest.cookieId,
        author_name: authorName,
        content,
        parent_post_id: null,
        client_ip: guest.ip,
        user_agent: guest.userAgent,
        spam_score: score,
        spam_reasons: allReasons,
      })
      .select('id, moderation_status, created_at')
      .single();

    if (error) {
      console.error('[wall/post] insert failed', error);
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
      // Roll back the post so we don't leave a pending post without its image.
      await admin.from('posts').delete().eq('id', inserted.id);
      return NextResponse.json(
        { error: attachmentLinkError.code, detail: attachmentLinkError.detail },
        { status: attachmentLinkError.status }
      );
    }

    // Broadcast push notification only when the post is publicly visible.
    if (inserted.moderation_status === 'approved') {
      const preview = content.length > 80 ? content.slice(0, 77) + '...' : content;
      sendPushToAll({
        title: `${authorName} posted on the wall`,
        body: preview,
        link: '/',
        tag: `post-${inserted.id}`,
      }).catch((err) => console.error('[wall/post] push broadcast failed', err));
    }

    return NextResponse.json({ success: true, post: inserted }, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
