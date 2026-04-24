import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  resolveGuest,
  isSameOriginWrite,
  isIpBanned,
  checkRateLimit,
} from '@/lib/wallGuest';
import {
  ALLOWED_IMAGE_MIME,
  MIME_EXTENSION,
  sniffImageMime,
} from '@/lib/imageSniff';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const STORAGE_BUCKET = 'wall-uploads';
const PREVIEW_TTL_SECONDS = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginWrite(request)) {
      return NextResponse.json({ error: 'bad_origin' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json({ error: 'invalid_content_type' }, { status: 400 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'missing_file' }, { status: 400 });
    }
    const blob = file as File;

    if (blob.size <= 0) {
      return NextResponse.json({ error: 'empty_file' }, { status: 400 });
    }
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
    }

    const guest = await resolveGuest(request);

    if (await isIpBanned(guest.ip)) {
      return NextResponse.json({ error: 'banned' }, { status: 403 });
    }

    const cookieOk = await checkRateLimit('upload', `cookie:${guest.cookieId}`, 10, 3600);
    const ipOk = guest.ip
      ? await checkRateLimit('upload', `ip:${guest.ip}`, 10, 3600)
      : true;
    if (!cookieOk || !ipOk) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    const buffer = new Uint8Array(await blob.arrayBuffer());
    const sniffed = sniffImageMime(buffer);
    if (!sniffed || !ALLOWED_IMAGE_MIME.includes(sniffed)) {
      return NextResponse.json({ error: 'unsupported_image_type' }, { status: 415 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
    }

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const ext = MIME_EXTENSION[sniffed];
    const fileId = randomUUID();
    const storagePath = `${yyyy}/${mm}/${guest.cookieId}/${fileId}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: sniffed,
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadErr) {
      console.error('[wall/upload] storage.upload failed', uploadErr);
      return NextResponse.json(
        { error: 'upload_failed', detail: uploadErr.message },
        { status: 500 }
      );
    }

    const { data: inserted, error: insertErr } = await admin
      .from('post_attachments')
      .insert({
        post_id: null,
        author_cookie_id: guest.cookieId,
        author_id: null,
        storage_path: storagePath,
        mime_type: sniffed,
        byte_size: blob.size,
        width: null,
        height: null,
      })
      .select('id, storage_path, mime_type, byte_size')
      .single();

    if (insertErr || !inserted) {
      // Best-effort cleanup of the orphaned object.
      await admin.storage.from(STORAGE_BUCKET).remove([storagePath]).catch(() => {});
      console.error('[wall/upload] db insert failed', insertErr);
      return NextResponse.json(
        { error: 'db_failed', detail: insertErr?.message },
        { status: 500 }
      );
    }

    const { data: signed, error: signErr } = await admin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, PREVIEW_TTL_SECONDS);

    if (signErr || !signed?.signedUrl) {
      console.error('[wall/upload] signed url failed', signErr);
      return NextResponse.json(
        { error: 'sign_failed', detail: signErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        attachment: {
          id: inserted.id,
          mime_type: inserted.mime_type,
          byte_size: inserted.byte_size,
          preview_url: signed.signedUrl,
          preview_expires_in: PREVIEW_TTL_SECONDS,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[wall/upload] unexpected', detail);
    return NextResponse.json({ error: 'internal_error', detail }, { status: 500 });
  }
}
