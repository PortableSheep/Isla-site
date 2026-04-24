'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { extractMedia, Linkified, MediaEmbeds } from '@/components/wall/media';
import { GifPicker } from '@/components/wall/GifPicker';

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
// (media helpers moved to ./media.tsx)

function PostBody({ post }: { post: Post }) {
  const { embeds, consumed } = useMemo(() => extractMedia(post.content), [post.content]);
  const showEmbeds = post.moderation_status === 'approved' || post.is_mine;
  return (
    <>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
        <Linkified text={post.content} hideUrls={showEmbeds ? consumed : undefined} />
      </p>
      {showEmbeds && <MediaEmbeds embeds={embeds} />}
    </>
  );
}

function CommentBody({ comment }: { comment: Comment }) {
  const { embeds, consumed } = useMemo(() => extractMedia(comment.content), [comment.content]);
  const showEmbeds = comment.moderation_status === 'approved' || comment.is_mine;
  return (
    <>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">
        <Linkified text={comment.content} hideUrls={showEmbeds ? consumed : undefined} />
      </p>
      {showEmbeds && <MediaEmbeds embeds={embeds} />}
    </>
  );
}

function MediaHelperBar({ onPickGif }: { onPickGif: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
      <button
        type="button"
        onClick={onPickGif}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-200 transition hover:border-fuchsia-400/40 hover:text-fuchsia-200"
      >
        🔎 Add a GIF
      </button>
      <span className="text-[11px] text-slate-500">
        Or paste any GIF / meme / YouTube link and it&apos;ll embed automatically.
      </span>
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
  // Optimistic overrides keyed by emoji. Each entry flips `mine` locally,
  // adjusts the count relative to server values, and carries an animKey so
  // we can retrigger the pop animation on every click.
  const [overrides, setOverrides] = useState<
    Record<string, { mine: boolean; delta: number; animKey: number }>
  >({});

  // Reset overrides whenever the server-side reactions change, so subsequent
  // feed refreshes become the source of truth again.
  useEffect(() => {
    setOverrides({});
    // Intentionally depend on the stringified values — arrays/objects would
    // cause a reset on every render.
  }, [JSON.stringify(post.reactions), JSON.stringify(post.my_reactions)]);

  if (post.moderation_status !== 'approved') return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {EMOJIS.map((e) => {
        const serverCount = post.reactions[e] ?? 0;
        const serverMine = post.my_reactions.includes(e);
        const ov = overrides[e];
        const mine = ov ? ov.mine : serverMine;
        const count = Math.max(0, serverCount + (ov?.delta ?? 0));
        const animKey = ov?.animKey ?? 0;

        const handleClick = () => {
          const currentlyMine = mine;
          const nextMine = !currentlyMine;
          const delta = nextMine
            ? serverMine
              ? 0
              : 1
            : serverMine
              ? -1
              : 0;
          setOverrides((prev) => ({
            ...prev,
            [e]: {
              mine: nextMine,
              delta,
              animKey: (prev[e]?.animKey ?? 0) + 1,
            },
          }));
          onReact(e, currentlyMine);
        };

        return (
          <button
            key={e}
            type="button"
            onClick={handleClick}
            // re-mount animation target on every click via keyed span below
            className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition active:scale-95 ${
              mine
                ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25'
            }`}
            aria-pressed={mine}
            aria-label={`React ${e}${count ? `, ${count} total` : ''}`}
          >
            <span
              key={animKey}
              className={animKey > 0 ? 'iz-reaction-pop inline-block' : 'inline-block'}
            >
              {e}
            </span>
            {count > 0 && <span className="text-xs text-slate-400">{count}</span>}
            {animKey > 0 && nextAnimShouldShowFly(ov) && (
              <span key={`fly-${animKey}`} aria-hidden className="iz-reaction-fly">
                {e}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Show the floating "+1" emoji only when the user is *adding* a reaction, not
// removing one — feels more natural.
function nextAnimShouldShowFly(
  ov: { mine: boolean; delta: number } | undefined
): boolean {
  return !!ov && ov.mine === true;
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
  const [gifOpen, setGifOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          <CommentBody comment={c} />
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
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Leave a comment… (paste a GIF / meme link too!)"
              maxLength={1000}
              className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setGifOpen(true)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 text-xs text-fuchsia-200 transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/20"
              aria-label="Add a GIF"
            >
              🔎 GIF
            </button>
            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="iz-btn-primary h-9 rounded-lg px-4 text-sm disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
          {err && <p className="text-xs text-rose-300">{err}</p>}
          <GifPicker
            open={gifOpen}
            onClose={() => setGifOpen(false)}
            onPick={(url) => {
              setContent((prev) => {
                const sep = prev && !prev.endsWith(' ') ? ' ' : '';
                return prev + sep + url;
              });
              setGifOpen(false);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          />
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
  const [gifOpen, setGifOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev ? prev.trimEnd() + '\n' + snippet : snippet));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const sep = before && !before.endsWith('\n') ? '\n' : '';
    const tail = after && !after.startsWith('\n') ? '\n' : '';
    const next = before + sep + snippet + tail + after;
    setContent(next);
    const caret = before.length + sep.length + snippet.length + tail.length;
    requestAnimationFrame(() => {
      el.focus();
      try {
        el.setSelectionRange(caret, caret);
      } catch {}
    });
  };

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
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Say hi, paste a GIF / meme / YouTube link, or tell Isla a joke…"
        rows={4}
        maxLength={2000}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
      />
      <MediaHelperBar onPickGif={() => setGifOpen(true)} />
      <GifPicker
        open={gifOpen}
        onClose={() => setGifOpen(false)}
        onPick={(url) => {
          insertAtCursor(url);
          setGifOpen(false);
        }}
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
            <PostBody post={p} />
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
