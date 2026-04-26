import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * Sends a single test push to the supplied endpoint, but ONLY if that
 * endpoint exists in the push_subscriptions table. This means callers must
 * already possess a valid subscription endpoint — the endpoint itself is
 * the secret, the same trust model the rest of the push code uses (see
 * supabase/migrations/029_anonymous_push_subscriptions.sql).
 *
 * Used by /debug/push to confirm the full delivery pipeline works on a
 * given device.
 */
export async function POST(request: NextRequest) {
  try {
    const { endpoint } = (await request.json()) as { endpoint?: string };
    if (!endpoint) {
      return NextResponse.json({ error: 'missing_endpoint' }, { status: 400 });
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!publicKey || !privateKey || !subject) {
      return NextResponse.json({ error: 'vapid_not_configured' }, { status: 500 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    const { data: sub, error } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'db_failed', detail: error.message }, { status: 500 });
    }
    if (!sub) {
      return NextResponse.json({ error: 'unknown_endpoint' }, { status: 404 });
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);

    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: 'Isla test push',
          body: 'If you can see this, push notifications are working on this device.',
          link: '/debug/push',
          tag: 'isla-test-push',
          force: true,
        }),
      );
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      return NextResponse.json(
        { error: 'send_failed', statusCode: e.statusCode ?? null, detail: e.message ?? String(err) },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
