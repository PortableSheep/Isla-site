import { NextResponse, type NextRequest } from 'next/server';
import { runModerationAlert } from '@/lib/moderationAlert';

export const dynamic = 'force-dynamic';

/**
 * Instant moderation alert endpoint. Invoked by a Supabase database
 * trigger (via pg_net) every time a post/comment lands with
 * `moderation_status='pending'`.
 *
 * Auth: shared-secret `Authorization: Bearer <MODERATION_WEBHOOK_SECRET>`.
 *
 * Safety:
 *   - `runModerationAlert` uses a watermark in `system_state` to dedupe,
 *     so rapid-fire triggers coalesce into at most one email per burst.
 *   - We respond 200 even if no email was sent (watermark already
 *     advanced) so Supabase doesn't retry unnecessarily.
 */

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.MODERATION_WEBHOOK_SECRET;
  if (!expected) {
    // Fail closed in production; allow in dev for easier iteration.
    return process.env.NODE_ENV !== 'production';
  }
  const header = request.headers.get('authorization');
  return header === `Bearer ${expected}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Body is accepted but unused — the handler always re-queries the DB so
  // it's resilient to partial payloads, retries, and trigger misfires.
  try {
    await request.json().catch(() => null);
  } catch {
    /* ignore */
  }

  const result = await runModerationAlert();
  // Always 200 on ok, even if emailed=false — the trigger already did
  // its job by notifying us, and Supabase shouldn't retry on benign skips.
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
