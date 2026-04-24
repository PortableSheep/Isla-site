import type { SupabaseClient } from '@supabase/supabase-js';

export const MAX_ATTACHMENTS_PER_POST = 1;

export type AttachmentLinkError = {
  code:
    | 'invalid_attachments'
    | 'attachment_not_found'
    | 'attachment_forbidden'
    | 'attachment_already_used'
    | 'too_many_attachments'
    | 'db_failed';
  detail?: string;
  status: number;
};

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}

/**
 * Validate + atomically link uploaded attachments to a newly-created
 * post/comment. Guards against:
 *   - non-UUID input
 *   - more than MAX_ATTACHMENTS_PER_POST
 *   - unknown attachment ids
 *   - attachments owned by a different author_cookie_id (hijacking)
 *   - already-attached attachments (double-use)
 *
 * Returns null on success, otherwise an error object the caller should
 * translate into an HTTP response (and roll back the post insert).
 */
export async function linkAttachmentsToPost(
  admin: SupabaseClient,
  rawIds: unknown,
  postId: string,
  authorCookieId: string
): Promise<AttachmentLinkError | null> {
  if (rawIds == null) return null; // no attachments is fine

  if (!Array.isArray(rawIds)) {
    return { code: 'invalid_attachments', status: 400 };
  }
  if (rawIds.length === 0) return null;

  if (rawIds.length > MAX_ATTACHMENTS_PER_POST) {
    return { code: 'too_many_attachments', status: 400 };
  }

  const ids = rawIds.filter(isUuid) as string[];
  if (ids.length !== rawIds.length) {
    return { code: 'invalid_attachments', status: 400 };
  }

  const { data: rows, error } = await admin
    .from('post_attachments')
    .select('id, post_id, author_cookie_id')
    .in('id', ids);

  if (error) {
    return { code: 'db_failed', detail: error.message, status: 500 };
  }
  if (!rows || rows.length !== ids.length) {
    return { code: 'attachment_not_found', status: 404 };
  }

  for (const row of rows) {
    if (row.author_cookie_id !== authorCookieId) {
      return { code: 'attachment_forbidden', status: 403 };
    }
    if (row.post_id !== null) {
      return { code: 'attachment_already_used', status: 409 };
    }
  }

  // Atomic link: only update rows that are still unlinked, to close the
  // narrow race between the SELECT above and the UPDATE below.
  const { data: updated, error: updateErr } = await admin
    .from('post_attachments')
    .update({ post_id: postId })
    .in('id', ids)
    .is('post_id', null)
    .select('id');

  if (updateErr) {
    return { code: 'db_failed', detail: updateErr.message, status: 500 };
  }
  if (!updated || updated.length !== ids.length) {
    return { code: 'attachment_already_used', status: 409 };
  }

  return null;
}
