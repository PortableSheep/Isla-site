import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail, getAppUrl } from '@/lib/email/resend';

/**
 * Shared "new moderation queue items → email the admin" routine.
 *
 * Used by both the daily Vercel cron (`/api/cron/moderation-digest`) and
 * the instant Supabase DB webhook (`/api/hooks/moderation-event`). Both
 * share a single watermark stored in `system_state` so they never double
 * alert: whichever fires first advances the watermark, the other one
 * sees 0 new items and no-ops.
 */

const STATE_KEY = 'moderation_digest';

interface DigestState {
  last_alerted_at: string | null;
  last_alerted_max_created_at: string | null;
}

export interface AlertResult {
  ok: boolean;
  pendingTotal: number;
  newSinceLastAlert: number;
  emailed: boolean;
  skipped?: boolean;
  recipients?: number;
  reason?: string;
  error?: string;
}

async function resolveFirstAdminEmail(admin: SupabaseClient): Promise<string | null> {
  // 1. Oldest family creator (parents are implicit admins in this codebase).
  const { data: family } = await admin
    .from('families')
    .select('created_by, created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const candidates: string[] = [];
  if (family?.created_by) candidates.push(family.created_by);

  // 2. Any user_profile with role='admin', oldest first.
  const { data: adminProfiles } = await admin
    .from('user_profiles')
    .select('user_id, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(5);
  for (const p of adminProfiles ?? []) {
    if (p.user_id && !candidates.includes(p.user_id)) candidates.push(p.user_id);
  }

  for (const uid of candidates) {
    try {
      const { data, error } = await admin.auth.admin.getUserById(uid);
      if (!error && data?.user?.email) return data.user.email;
    } catch {
      // try next
    }
  }
  return null;
}

function truncate(text: string, max = 140): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Run one pass of the alert. Idempotent + cheap — safe to call from
 * triggers, crons, and manual admin actions.
 */
export async function runModerationAlert(): Promise<AlertResult> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      pendingTotal: 0,
      newSinceLastAlert: 0,
      emailed: false,
      error: 'service_role_unavailable',
    };
  }

  const { data: stateRow } = await admin
    .from('system_state')
    .select('value')
    .eq('key', STATE_KEY)
    .maybeSingle();

  const state: DigestState =
    (stateRow?.value as DigestState | undefined) ?? {
      last_alerted_at: null,
      last_alerted_max_created_at: null,
    };

  const { data: pending, error } = await admin
    .from('posts')
    .select('id, author_name, content, parent_post_id, created_at')
    .eq('moderation_status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('[mod-alert] query failed', error);
    return {
      ok: false,
      pendingTotal: 0,
      newSinceLastAlert: 0,
      emailed: false,
      error: error.message,
    };
  }

  const allPending = pending ?? [];
  const watermark = state.last_alerted_max_created_at
    ? new Date(state.last_alerted_max_created_at).getTime()
    : 0;
  const newItems = allPending.filter(
    (p) => new Date(p.created_at).getTime() > watermark,
  );

  if (newItems.length === 0) {
    return {
      ok: true,
      pendingTotal: allPending.length,
      newSinceLastAlert: 0,
      emailed: false,
    };
  }

  const to = (process.env.MOD_ALERT_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (to.length === 0) {
    const resolved = await resolveFirstAdminEmail(admin);
    if (resolved) to.push(resolved);
  }

  if (to.length === 0) {
    console.warn('[mod-alert] no admin email resolved — skipping send');
    return {
      ok: true,
      pendingTotal: allPending.length,
      newSinceLastAlert: newItems.length,
      emailed: false,
      reason: 'no_recipients',
    };
  }

  const appUrl = getAppUrl();
  const modUrl = `${appUrl}/admin/moderation`;
  const totalPending = allPending.length;
  const subject =
    newItems.length === 1
      ? `Isla wall: 1 new post awaiting moderation`
      : `Isla wall: ${newItems.length} new posts awaiting moderation`;

  const rowsHtml = newItems
    .slice(0, 20)
    .map((p) => {
      const author = escapeHtml(p.author_name || 'anonymous');
      const kind = p.parent_post_id ? 'comment' : 'post';
      const snippet = escapeHtml(truncate(p.content || '(no text)'));
      const when = new Date(p.created_at).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
      });
      return `<tr>
  <td style="padding:6px 10px;border-bottom:1px solid #1f2937;font-family:monospace;font-size:12px;color:#94a3b8;">${when}</td>
  <td style="padding:6px 10px;border-bottom:1px solid #1f2937;color:#e2e8f0;">${kind} by <b>${author}</b><br><span style="color:#cbd5e1;">${snippet}</span></td>
</tr>`;
    })
    .join('\n');

  const more =
    newItems.length > 20
      ? `<p style="color:#94a3b8;font-size:13px;">…and ${newItems.length - 20} more.</p>`
      : '';

  const html = `<!doctype html>
<html><body style="background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
    <h1 style="margin:0 0 8px 0;font-size:20px;color:#f472b6;">Moderation queue</h1>
    <p style="margin:0 0 16px 0;color:#cbd5e1;">
      ${newItems.length} new item${newItems.length === 1 ? '' : 's'} since the last alert.
      ${totalPending} total pending.
    </p>
    <p style="margin:0 0 20px 0;">
      <a href="${modUrl}" style="display:inline-block;background:#a21caf;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Open moderation dashboard</a>
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rowsHtml}
    </table>
    ${more}
    <p style="margin:20px 0 0 0;color:#64748b;font-size:12px;">Isla.site • automated alert</p>
  </div>
</body></html>`;

  const text =
    `${newItems.length} new item(s) awaiting moderation (${totalPending} total pending).\n\n` +
    newItems
      .slice(0, 20)
      .map((p) => {
        const kind = p.parent_post_id ? 'comment' : 'post';
        return `- ${kind} by ${p.author_name || 'anonymous'}: ${truncate(p.content || '(no text)')}`;
      })
      .join('\n') +
    `\n\nDashboard: ${modUrl}\n`;

  const result = await sendEmail({ to, subject, html, text });

  if (!result.ok) {
    return {
      ok: false,
      pendingTotal: totalPending,
      newSinceLastAlert: newItems.length,
      emailed: false,
      error: result.error ?? 'email_failed',
    };
  }

  const maxCreatedAt = newItems[newItems.length - 1].created_at;
  const newState: DigestState = {
    last_alerted_at: new Date().toISOString(),
    last_alerted_max_created_at: maxCreatedAt,
  };

  const { error: upsertError } = await admin
    .from('system_state')
    .upsert(
      { key: STATE_KEY, value: newState, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );

  if (upsertError) {
    console.error('[mod-alert] watermark upsert failed', upsertError);
  }

  return {
    ok: true,
    pendingTotal: totalPending,
    newSinceLastAlert: newItems.length,
    emailed: true,
    skipped: result.skipped === true,
    recipients: to.length,
  };
}
