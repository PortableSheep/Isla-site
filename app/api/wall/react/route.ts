import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  resolveGuest,
  isSameOriginWrite,
  isIpBanned,
  checkRateLimit,
} from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

const ALLOWED_EMOJI = new Set(['❤️', '👍', '😂', '😮', '😢', '🎉', '🔥']);

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginWrite(request)) {
      return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const rawPost: unknown = body?.post_id;
    const rawEmoji: unknown = body?.emoji;
    const rawToggle: unknown = body?.toggle;
    const postId = typeof rawPost === 'string' ? rawPost.trim() : '';
    const emoji = typeof rawEmoji === 'string' ? rawEmoji : '';
    const toggleOff = rawToggle === true;

    if (!/^[0-9a-f-]{36}$/i.test(postId)) {
      return NextResponse.json({ error: 'invalid_post' }, { status: 400 });
    }
    if (!ALLOWED_EMOJI.has(emoji)) {
      return NextResponse.json({ error: 'invalid_emoji' }, { status: 400 });
    }

    const guest = await resolveGuest(request);
    if (await isIpBanned(guest.ip)) {
      return NextResponse.json({ error: 'banned' }, { status: 403 });
    }

    const cookieOk = await checkRateLimit('react', `cookie:${guest.cookieId}`, 100, 3600);
    if (!cookieOk) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    // Reactions only on approved visible posts.
    const { data: visible, error: visErr } = await admin.rpc('is_wall_post_visible', {
      p_id: postId,
    });
    if (visErr) {
      return NextResponse.json(
        { error: 'db_failed', detail: visErr.message },
        { status: 500 }
      );
    }
    if (!visible) {
      return NextResponse.json({ error: 'post_unavailable' }, { status: 404 });
    }

    if (toggleOff) {
      const { error: delErr } = await admin
        .from('post_reactions')
        .delete()
        .match({
          post_id: postId,
          author_cookie_id: guest.cookieId,
          emoji,
        });
      if (delErr) {
        return NextResponse.json(
          { error: 'db_failed', detail: delErr.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, removed: true });
    }

    // upsert via insert-ignore
    const { error: insErr } = await admin.from('post_reactions').insert({
      post_id: postId,
      user_id: null,
      author_cookie_id: guest.cookieId,
      client_ip: guest.ip,
      emoji,
    });
    if (insErr && !insErr.message.match(/duplicate key/i)) {
      return NextResponse.json(
        { error: 'db_failed', detail: insErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, added: true }, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
