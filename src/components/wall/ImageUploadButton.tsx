'use client';

import { useRef, useState } from 'react';

export type PendingAttachment = {
  id: string;
  previewUrl: string;
};

type UploadResponse = {
  success: boolean;
  attachment?: {
    id: string;
    preview_url: string;
    mime_type: string;
    byte_size: number;
  };
  error?: string;
  detail?: string;
};

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_BYTES = 8 * 1024 * 1024;

const ERROR_MESSAGES: Record<string, string> = {
  file_too_large: 'Image must be under 8 MB.',
  unsupported_image_type: 'Only PNG, JPEG, WEBP, and GIF are allowed.',
  rate_limited: "You've uploaded a lot — try again in a bit.",
  banned: 'This device is blocked from uploading.',
  invalid_content_type: 'Upload failed (bad request).',
  missing_file: 'No file selected.',
  empty_file: 'That file was empty.',
};

export function ImageUploadButton({
  attachment,
  onChange,
  disabled,
  compact,
}: {
  attachment: PendingAttachment | null;
  onChange: (next: PendingAttachment | null) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setErr(null);
    if (file.size > MAX_BYTES) {
      setErr(ERROR_MESSAGES.file_too_large);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/wall/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as UploadResponse;
      if (!res.ok || !json.success || !json.attachment) {
        const code = json.error ?? '';
        setErr(
          ERROR_MESSAGES[code] ??
            json.detail ??
            `Upload failed (${res.status})`
        );
        return;
      }
      onChange({
        id: json.attachment.id,
        previewUrl: json.attachment.preview_url,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = () => {
    onChange(null);
    setErr(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        {!attachment ? (
          <button
            type="button"
            onClick={pick}
            disabled={disabled || busy}
            className={
              compact
                ? 'inline-flex h-9 items-center gap-1 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 text-xs text-fuchsia-200 transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/20 disabled:opacity-50'
                : 'inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:border-fuchsia-400/40 hover:text-fuchsia-200 disabled:opacity-50'
            }
            aria-label="Add an image from your device"
          >
            {busy ? '⏳ Uploading…' : '📷 Add image'}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-fuchsia-400/30 bg-fuchsia-500/10 px-2 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.previewUrl}
              alt="Upload preview"
              className="h-10 w-10 rounded object-cover"
            />
            <span className="text-xs text-fuchsia-200">Image attached</span>
            <button
              type="button"
              onClick={remove}
              disabled={disabled || busy}
              aria-label="Remove attached image"
              className="ml-1 rounded px-1 text-xs text-fuchsia-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {err && <p className="text-xs text-rose-300">{err}</p>}
    </div>
  );
}
