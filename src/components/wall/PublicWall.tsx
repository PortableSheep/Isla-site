'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Comment = {
  id: string;
  parent_post_id: string | null;
  author_name: string | null;
  content: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  is_mine: boolean;
};

type Post = Comment & {
  reactions: Record<string, number>;
  my_reactions: string[];
  comments: Comment[];
};

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🎉', '🔥'];

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function Badge({ status }: { status: Comment['moderation_status'] }) {
  if (status === 'approved') return null;
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
        Waiting for Dad to approve
      </span>
    );
  }
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
  onSubmit,
}: {
  post: Post;
  onSubmit: (parentId: string, name: string, content: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
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
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{c.content}</p>
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
              await onSubmit(post.id, name.trim(), content.trim());
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={40}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none sm:max-w-[220px]"
            />
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
  onSubmit,
}: {
  onSubmit: (name: string, content: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
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
          await onSubmit(name.trim(), content.trim());
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
      <h2 className="text-lg font-semibold">Leave a note for Isla 💌</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        maxLength={40}
        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Say hi, share a memory, draw a doodle with words…"
        rows={4}
        maxLength={2000}
        className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
      />
      <div className="flex items-center justify-between">
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

export function PublicWall() {
  const [feed, setFeed] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/wall/feed', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error(`Feed failed (${res.status})`);
      const json = await res.json();
      setFeed(json.feed as Post[]);
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
      const res = await fetch('/api/wall/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ author_name: name || undefined, content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) throw new Error('You\u2019re posting a bit too fast \u2014 try again in a bit.');
        if (res.status === 403 && body?.error === 'banned') throw new Error('This device has been banned from posting.');
        throw new Error(body?.detail || body?.error || `Failed (${res.status})`);
      }
      scheduleReload();
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
      <header className="text-center">
        <h1 className="iz-gradient-text text-4xl font-bold tracking-tight md:text-5xl">
          Isla&apos;s Wall
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Notes, doodles, and hellos from anyone who wants to say hi.
        </p>
      </header>

      <Composer onSubmit={submitPost} />

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
              {p.content}
            </p>
            <ReactionBar
              post={p}
              onReact={(emoji, removing) => submitReaction(p.id, emoji, removing)}
            />
            <CommentBlock post={p} onSubmit={submitComment} />
          </article>
        ))}
        {feed !== null && items.length === 0 && (
          <p className="text-center text-sm text-slate-400">
            The wall is quiet right now. Be the first to say hi!
          </p>
        )}
      </div>
    </div>
  );
}
