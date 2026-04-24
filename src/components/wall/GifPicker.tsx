'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type PickerItem = {
  id: string;
  preview_url: string;
  share_url: string;
  description: string;
  width?: number;
  height?: number;
};

export function GifPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (shareUrl: string) => void;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<PickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastQueryRef = useRef<string>('__never__');

  const runSearch = useCallback(async (query: string) => {
    setLoading(true);
    setErr(null);
    try {
      const resp = await fetch(
        `/api/wall/gif-search?q=${encodeURIComponent(query)}`,
        { cache: 'no-store' },
      );
      if (resp.status === 503) {
        setNotConfigured(true);
        setItems([]);
        return;
      }
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Search failed (${resp.status})`);
      }
      const body = (await resp.json()) as { results: PickerItem[] };
      setItems(body.results ?? []);
      setNotConfigured(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Search failed');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load featured GIFs on open, debounce searches while typing.
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed === lastQueryRef.current) return;
    const t = setTimeout(() => {
      lastQueryRef.current = trimmed;
      void runSearch(trimmed);
    }, trimmed ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, q, runSearch]);

  // Reset when (re)opening and focus the search input.
  useEffect(() => {
    if (open) {
      lastQueryRef.current = '__never__';
      setQ('');
      setErr(null);
      setNotConfigured(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Escape to close, body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gif-picker-title"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl sm:h-[70vh]">
        <div className="flex items-center gap-3 border-b border-white/10 p-3">
          <div
            id="gif-picker-title"
            role="heading"
            aria-level={2}
            className="shrink-0 text-sm font-semibold text-slate-100"
          >
            🎞️ Pick a GIF
          </div>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search GIFs…"
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
            aria-label="Search GIFs"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:border-white/25 hover:text-white"
            aria-label="Close GIF picker"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {notConfigured ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              GIF search isn&apos;t set up yet. Ask Isla&apos;s dad to add{' '}
              <code className="rounded bg-black/40 px-1">GIPHY_API_KEY</code>. You can
              still paste a GIF link from{' '}
              <a
                href="https://giphy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fuchsia-300 underline"
              >
                giphy.com
              </a>{' '}
              or{' '}
              <a
                href="https://tenor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fuchsia-300 underline"
              >
                tenor.com
              </a>
              .
            </div>
          ) : err ? (
            <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
              {err}
            </div>
          ) : loading && items.length === 0 ? (
            <GridSkeleton />
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              No GIFs found. Try a different search.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onPick(it.share_url)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40 transition hover:border-fuchsia-400/70 focus:border-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  aria-label={it.description || 'Pick this GIF'}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.preview_url}
                    alt={it.description || ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-500">
          Powered by GIPHY · Filtered for kids · Dad still reviews every post
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-lg border border-white/5 bg-white/5"
        />
      ))}
    </div>
  );
}
