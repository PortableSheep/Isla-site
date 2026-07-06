import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getSbClient } from '@/lib/supabaseClient';
import { isSameOriginWrite, resolveGuest, getIslaFamilyId } from '@/lib/wallGuest';

export const dynamic = 'force-dynamic';

const MAX_REQUEST_MESSAGE = 500;

export async function POST(request: NextRequest) {
  if (!isSameOriginWrite(request)) {
    return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const rawPostId: unknown = body?.post_id;
  const rawMessage: unknown = body?.message;
  const postId = typeof rawPostId === 'string' ? rawPostId.trim() : '';
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';

  if (!/^[0-9a-f-]{36}$/i.test(postId)) {
    return NextResponse.json({ error: 'invalid_post_id' }, { status: 400 });
  }
  if (message.length > MAX_REQUEST_MESSAGE) {
    return NextResponse.json(
      { error: 'message_too_long', detail: `Must be <= ${MAX_REQUEST_MESSAGE} characters` },
      { status: 400 }
    );
  }

  const familyId = getIslaFamilyId();
  if (!familyId) {
    return NextResponse.json({ error: 'wall_unconfigured' }, { status: 500 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const guest = await resolveGuest(request);
  let authUserId: string | null = null;
  try {
    const sb = await getSbClient();
    const { data } = await sb.auth.getUser();
    authUserId = data.user?.id ?? null;
  } catch {
    authUserId = null;
  }

  const { data: post, error: postErr } = await admin
    .from('posts')
    .select('id, moderation_status, author_cookie_id, author_id, family_id')
    .eq('id', postId)
    .maybeSingle();
  if (postErr) {
    return NextResponse.json({ error: 'db_failed', detail: postErr.message }, { status: 500 });
  }
  if (!post || post.family_id !== familyId) {
    return NextResponse.json({ error: 'post_not_found' }, { status: 404 });
  }
  if (post.moderation_status !== 'rejected') {
    return NextResponse.json({ error: 'post_not_rejected' }, { status: 409 });
  }

  const ownsPost =
    (authUserId && post.author_id === authUserId) || post.author_cookie_id === guest.cookieId;
  if (!ownsPost) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let pendingQuery = admin
    .from('post_review_requests')
    .select('id, created_at')
    .eq('post_id', postId)
    .eq('status', 'pending')
    .limit(1);
  if (authUserId) pendingQuery = pendingQuery.eq('requester_user_id', authUserId);
  else pendingQuery = pendingQuery.eq('requester_cookie_id', guest.cookieId);

  const { data: existingPending, error: pendingErr } = await pendingQuery.maybeSingle();
  if (pendingErr) {
    return NextResponse.json({ error: 'db_failed', detail: pendingErr.message }, { status: 500 });
  }
  if (existingPending) {
    return NextResponse.json(
      { error: 'review_request_already_pending', submitted_at: existingPending.created_at },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertErr } = await admin
    .from('post_review_requests')
    .insert({
      post_id: postId,
      requester_user_id: authUserId,
      requester_cookie_id: authUserId ? null : guest.cookieId,
      request_message: message || null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select(
      'id, post_id, requester_user_id, requester_cookie_id, request_message, status, reviewed_by, reviewed_at, review_response, created_at, updated_at'
    )
    .single();
  if (insertErr) {
    return NextResponse.json({ error: 'db_failed', detail: insertErr.message }, { status: 500 });
  }

  if (authUserId) {
    await admin.from('audit_logs').insert({
      action: 'post_review_requested',
      actor_id: authUserId,
      actor_role: 'parent',
      subject_type: 'post',
      subject_id: postId,
      reason: message || 'User requested moderator re-review for rejected post',
      created_at: now,
      metadata: { review_request_id: inserted.id },
    });
  }

  return NextResponse.json({ success: true, request: inserted }, { status: 201 });
}
