'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';

type Comment = {
  id: string;
  parent_post_id: string | null;
  author_name: string | null;
  content: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  is_mine: boolean;
  _optimistic?: boolean;
};

type Post = Comment & {
  reactions: Record<string, number>;
  my_reactions: string[];
  comments: Comment[];
};

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🎉', '🔥'];
const NAME_KEY = 'wall_author_name';

function readSavedName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveName(name: string) {
  if (typeof window === 'undefined') return;
  try {
    if (name) window.localStorage.setItem(NAME_KEY, name);
    else window.localStorage.removeItem(NAME_KEY);
  } catch {
    /* ignore quota/permission */
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

// Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
const YT_REGEX =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[^\s]*)?/gi;

function extractYouTubeIds(text: string): string[] {
  const ids = new Set<string>();
  for (const m of text.matchAll(YT_REGEX)) {
    if (m[1]) ids.add(m[1]);
  }
  return Array.from(ids);
}

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function Linkified({ text }: { text: string }) {
  const parts: (string | { href: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_REGEX)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push({ href: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-fuchsia-300 underline decoration-dotted underline-offset-2 hover:text-fuchsia-200"
          >
            {p.href}
          </a>
        )
      )}
    </>
  );
}

function YouTubeEmbeds({ content }: { content: string }) {
  const ids = useMemo(() => extractYouTubeIds(content), [content]);
  if (ids.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {ids.slice(0, 3).map((id) => (
        <div
          key={id}
          className="relative w-full overflow-hidden rounded-xl border border-white/10"
          style={{ paddingBottom: '56.25%' }}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ))}
    </div>
  );
}

function Badge({ status }: { status: Comment['moderation_status'] }) {
  if (status === 'approved' || status === 'pending') return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-300">
      Not approved
    </span>
  );
}

function ReactionBar({
  post,
  onReact,
}: {
  post: Post;
  onReact: (emoji: string, removing: boolean) => void;
}) {
  if (post.moderation_status !== 'approved') return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {EMOJIS.map((e) => {
        const count = post.reactions[e] ?? 0;
        const mine = post.my_reactions.includes(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => onReact(e, mine)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
              mine
                ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'
            }`}
            aria-pressed={mine}
            aria-label={`React ${e}${count ? `, ${count} total` : ''}`}
          >
            <span>{e}</span>
            {count > 0 && <span className="text-xs text-slate-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CommentBlock({
  post,
  requireName,
  onSubmit,
}: {
  post: Post;
  requireName: () => Promise<string | null>;
  onSubmit: (parentId: string, name: string, content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (post.moderation_status !== 'approved' && !post.is_mine) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-white/5 pt-3">
      {post.comments.map((c) => (
        <div key={c.id} className="rounded-xl bg-white/5 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-200">{c.author_name || 'Anonymous'}</span>
            <span>·</span>
            <span>{formatTime(c.created_at)}</span>
            <Badge status={c.moderation_status} />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">
            <Linkified text={c.content} />
          </p>
        </div>
      ))}

      {post.moderation_status === 'approved' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!content.trim() || busy) return;
            setBusy(true);
            setErr(null);
            try {
              const name = await requireName();
              if (!name) {
                setBusy(false);
                return;
              }
              await onSubmit(post.id, name, content.trim());
              setContent('');
            } catch (error) {
              setErr(error instanceof Error ? error.message : 'Something went wrong');
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-2"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Leave a comment…"
              maxLength={1000}
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="iz-btn-primary h-9 rounded-lg px-4 text-sm disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
          {err && <p className="text-xs text-rose-300">{err}</p>}
        </form>
      )}
    </div>
  );
}

function Composer({
  savedName,
  onOpenSettings,
  requireName,
  onSubmit,
}: {
  savedName: string;
  onOpenSettings: () => void;
  requireName: () => Promise<string | null>;
  onSubmit: (name: string, content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!content.trim() || busy) return;
        setBusy(true);
        setErr(null);
        setOkMsg(null);
        try {
          const name = await requireName();
          if (!name) {
            setBusy(false);
            return;
          }
          await onSubmit(name, content.trim());
          setContent('');
          setOkMsg('Thanks! Dad will read this soon and approve it for the wall.');
        } catch (error) {
          setErr(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Leave a note for Isla 💌</h2>
        {savedName ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs text-slate-400 hover:text-fuchsia-300"
            aria-label="Change your name"
          >
            Posting as <span className="font-medium text-slate-200">{savedName}</span>
            <span className="ml-1 underline decoration-dotted">change</span>
          </button>
        ) : null}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Say hi, share a YouTube link, tell Isla a joke…"
        rows={4}
        maxLength={2000}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Posts are reviewed by Isla&apos;s dad before showing up publicly. You&apos;ll see your own
          note while it&apos;s waiting.
        </p>
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="iz-btn-primary h-10 rounded-lg px-5 text-sm disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Post to wall'}
        </button>
      </div>
      {err && <p className="text-sm text-rose-300">{err}</p>}
      {okMsg && <p className="text-sm text-emerald-300">{okMsg}</p>}
    </form>
  );
}

function NameDialog({
  open,
  initialName,
  firstTime,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  initialName: string;
  firstTime: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (open) setValue(initialName);
  }, [open, initialName]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !firstTime) onCancel();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = value.trim();
          if (!n) return;
          onSubmit(n);
        }}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-950/90 p-5 shadow-2xl"
      >
        <h3 id="name-dialog-title" className="text-lg font-semibold text-white">
          {firstTime ? 'What should we call you?' : 'Change your display name'}
        </h3>
        <p className="text-xs text-slate-400">
          Your name shows up on posts and comments. Saved on this device only.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Maya, or Isla's cousin"
          maxLength={40}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          {!firstTime && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-300 hover:border-white/25"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!value.trim()}
            className="iz-btn-primary rounded-lg px-4 py-1.5 text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function PublicWall() {
  const [feed, setFeed] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState('');
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFirstTime, setDialogFirstTime] = useState(false);
  const pendingResolver = useRef<((name: string | null) => void) | null>(null);

  useEffect(() => {
    setSavedName(readSavedName());
  }, []);

  const requireName = useCallback((): Promise<string | null> => {
    const existing = readSavedName();
    if (existing) {
      setSavedName(existing);
      return Promise.resolve(existing);
    }
    return new Promise<string | null>((resolve) => {
      pendingResolver.current = resolve;
      setDialogFirstTime(true);
      setDialogOpen(true);
    });
  }, []);

  const openSettings = useCallback(() => {
    setDialogFirstTime(false);
    setDialogOpen(true);
  }, []);

  const handleDialogSubmit = useCallback((name: string) => {
    saveName(name);
    setSavedName(name);
    setDialogOpen(false);
    if (pendingResolver.current) {
      pendingResolver.current(name);
      pendingResolver.current = null;
    }
  }, []);

  const handleDialogCancel = useCallback(() => {
    setDialogOpen(false);
    if (pendingResolver.current) {
      pendingResolver.current(null);
      pendingResolver.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/wall/feed', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error(`Feed failed (${res.status})`);
      const json = await res.json();
      setFeed((prev) => {
        const incoming = (json.feed as Post[]) ?? [];
        if (!prev) return incoming;
        // Keep optimistic items that don't yet exist server-side (by matching content+created window)
        const keepers = prev.filter(
          (p) =>
            p._optimistic &&
            !incoming.some((q) => q.content === p.content && q.is_mine && q.parent_post_id === null)
        );
        return [...keepers, ...incoming];
      });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load wall');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(refresh, 400);
  }, [refresh]);

  const submitPost = useCallback(
    async (name: string, content: string) => {
      // optimistic insert
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: Post = {
        id: tempId,
        parent_post_id: null,
        author_name: name || null,
        content,
        moderation_status: 'pending',
        created_at: new Date().toISOString(),
        is_mine: true,
        reactions: {},
        my_reactions: [],
        comments: [],
        _optimistic: true,
      };
      setFeed((prev) => (prev ? [optimistic, ...prev] : [optimistic]));

      try {
        const res = await fetch('/api/wall/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ author_name: name || undefined, content }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // remove the optimistic row
          setFeed((prev) => prev?.filter((p) => p.id !== tempId) ?? null);
          if (res.status === 429) throw new Error('You\u2019re posting a bit too fast — try again in a bit.');
          if (res.status === 403 && body?.error === 'banned')
            throw new Error('This device has been banned from posting.');
          throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
        }
      } finally {
        scheduleReload();
      }
    },
    [scheduleReload]
  );

  const submitComment = useCallback(
    async (parentId: string, name: string, content: string) => {
      const res = await fetch('/api/wall/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parent_post_id: parentId,
          author_name: name || undefined,
          content,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
      }
      scheduleReload();
    },
    [scheduleReload]
  );

  const submitReaction = useCallback(
    async (postId: string, emoji: string, removing: boolean) => {
      const res = await fetch('/api/wall/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId, emoji, toggle: removing }),
      });
      if (!res.ok) return;
      scheduleReload();
    },
    [scheduleReload]
  );

  const items = useMemo(() => feed ?? [], [feed]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <NameDialog
        open={dialogOpen}
        initialName={savedName}
        firstTime={dialogFirstTime}
        onCancel={handleDialogCancel}
        onSubmit={handleDialogSubmit}
      />

      <button
        type="button"
        onClick={openSettings}
        aria-label="Settings (change your display name)"
        title={savedName ? `Posting as ${savedName}` : 'Set your display name'}
        className="fixed top-3 right-14 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-slate-500 backdrop-blur-md transition hover:border-fuchsia-400/40 hover:bg-slate-900/80 hover:text-fuchsia-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.15.37.53.6.93.6H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
        </svg>
      </button>

      <header className="relative text-center">
        <div className="pointer-events-none absolute -top-2 left-0 hidden md:block">
          <CreatureDisplay creatureId="sparkle" state="happy" animation="bounce" size="medium" />
        </div>
        <div className="pointer-events-none absolute -top-2 right-0 hidden md:block">
          <CreatureDisplay creatureId="glimmer" state="happy" animation="gentle_bounce" size="medium" />
        </div>
        <h1 className="iz-gradient-text text-4xl font-bold tracking-tight md:text-5xl">
          Isla&apos;s Wall
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Notes, doodles, YouTube links, and hellos from anyone who wants to say hi.
        </p>
      </header>

      <Composer
        savedName={savedName}
        onOpenSettings={openSettings}
        requireName={requireName}
        onSubmit={submitPost}
      />

      {loadError && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      )}

      {feed === null && !loadError && (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
        </div>
      )}

      <div className="flex flex-col gap-5">
        {items.map((p) => (
          <article
            key={p.id}
            className={`rounded-2xl border p-4 backdrop-blur ${
              p.is_mine && p.moderation_status !== 'approved'
                ? 'border-amber-400/30 bg-amber-500/5'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="font-medium text-slate-100">{p.author_name || 'Anonymous'}</span>
              <span>·</span>
              <span>{formatTime(p.created_at)}</span>
              <Badge status={p.moderation_status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
              <Linkified text={p.content} />
            </p>
            {p.moderation_status === 'approved' && <YouTubeEmbeds content={p.content} />}
            <ReactionBar post={p} onReact={(emoji, removing) => submitReaction(p.id, emoji, removing)} />
            <CommentBlock post={p} requireName={requireName} onSubmit={submitComment} />
          </article>
        ))}
        {feed !== null && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CreatureDisplay creatureId="drift" state="neutral" animation="gentle_bounce" size="large" />
            <p className="text-sm text-slate-400">
              The wall is quiet right now. Be the first to say hi!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
