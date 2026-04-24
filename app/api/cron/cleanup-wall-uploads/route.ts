import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cleanup cron for wall image attachments.
 *
 * Deletes two categories of no-longer-needed attachments from both the DB
 * and the `wall-uploads` private storage bucket:
 *   1. Orphaned uploads: rows with post_id IS NULL that are older than 24h.
 *      These happen when a user opens the composer, uploads a file, then
 *      walks away without submitting, or when the post insert rolls back.
 *   2. Rejected-post attachments: rows whose linked post has
 *      moderation_status = 'rejected' for more than 7 days.
 *
 * Auth is the same Bearer CRON_SECRET pattern used by other cron routes.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'service_role_not_configured' },
      { status: 500 }
    );
  }
  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const toDelete: Array<{ id: string; storage_path: string }> = [];

  // 1. Orphans
  {
    const { data, error } = await admin
      .from('post_attachments')
      .select('id, storage_path')
      .is('post_id', null)
      .lt('created_at', oneDayAgo)
      .limit(500);
    if (error) {
      return NextResponse.json(
        { ok: false, stage: 'orphans', error: error.message },
        { status: 500 }
      );
    }
    for (const row of data ?? []) toDelete.push(row);
  }

  // 2. Rejected posts older than 7 days
  {
    const { data, error } = await admin
      .from('post_attachments')
      .select('id, storage_path, posts!inner(moderation_status, created_at)')
      .eq('posts.moderation_status', 'rejected')
      .lt('posts.created_at', sevenDaysAgo)
      .limit(500);
    if (error) {
      return NextResponse.json(
        { ok: false, stage: 'rejected', error: error.message },
        { status: 500 }
      );
    }
    for (const row of (data ?? []) as Array<{ id: string; storage_path: string }>) {
      toDelete.push({ id: row.id, storage_path: row.storage_path });
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const paths = toDelete.map((r) => r.storage_path);
  const ids = toDelete.map((r) => r.id);

  const { error: storageErr } = await admin.storage
    .from('wall-uploads')
    .remove(paths);
  if (storageErr) {
    console.warn('[cleanup-wall-uploads] storage remove error:', storageErr.message);
  }

  const { error: dbErr } = await admin
    .from('post_attachments')
    .delete()
    .in('id', ids);
  if (dbErr) {
    return NextResponse.json(
      { ok: false, stage: 'db_delete', error: dbErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, deleted: ids.length });
}
