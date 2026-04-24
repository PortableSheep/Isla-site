import { NextResponse } from 'next/server';
import { runModerationAlert } from '@/lib/moderationAlert';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron fallback for the moderation alert. The real-time path is the
 * Supabase DB webhook at `/api/hooks/moderation-event`; this cron runs
 * daily as a belt-and-suspenders safety net in case the webhook is
 * misconfigured or temporarily failing.
 *
 * We gate with `CRON_SECRET` so random internet traffic can't trigger it
 * (Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically).
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local/dev: allow
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runModerationAlert();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
