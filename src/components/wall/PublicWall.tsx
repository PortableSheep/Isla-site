'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import { extractMedia, Linkified, MediaEmbeds } from '@/components/wall/media';
import { GifPicker } from '@/components/wall/GifPicker';
import {
  ImageUploadButton,
  type PendingAttachment,
} from '@/components/wall/ImageUploadButton';
import {
  ModeratedImageList,
  type FeedAttachment,
} from '@/components/wall/ModeratedImage';

type Comment = {
  id: string;
  parent_post_id: string | null;
  author_name: string | null;
  content: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  is_mine: boolean;
  attachments?: FeedAttachment[];
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
  const isAuthorPending = post.is_mine && post.moderation_status !== 'approved';
  return (
    <>
      <p className="mt-3 break-words whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
        <Linkified text={post.content} hideUrls={showEmbeds ? consumed : undefined} />
      </p>
      {showEmbeds && <MediaEmbeds embeds={embeds} />}
      {showEmbeds && post.attachments && (
        <ModeratedImageList
          attachments={post.attachments}
          isAuthorPending={isAuthorPending}
        />
      )}
    </>
  );
}

function CommentBody({ comment }: { comment: Comment }) {
  const { embeds, consumed } = useMemo(() => extractMedia(comment.content), [comment.content]);
  const showEmbeds = comment.moderation_status === 'approved' || comment.is_mine;
  const isAuthorPending = comment.is_mine && comment.moderation_status !== 'approved';
  return (
    <>
      <p className="mt-1 break-words whitespace-pre-wrap text-sm text-slate-100">
        <Linkified text={comment.content} hideUrls={showEmbeds ? consumed : undefined} />
      </p>
      {showEmbeds && <MediaEmbeds embeds={embeds} />}
      {showEmbeds && comment.attachments && (
        <ModeratedImageList
          attachments={comment.attachments}
          isAuthorPending={isAuthorPending}
        />
      )}
    </>
  );
}

function MediaHelperBar({ onPickGif, onInsert }: { onPickGif: () => void; onInsert: (url: string) => void }) {
  const [ytOpen, setYtOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const ytInputRef = useRef<HTMLInputElement>(null);

  const isYouTubeUrl = (url: string) =>
    /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch|shorts|embed)|youtu\.be\/)/i.test(url);

  const handleEmbed = () => {
    const trimmed = ytUrl.trim();
    if (!trimmed || !isYouTubeUrl(trimmed)) return;
    onInsert(trimmed);
    setYtUrl('');
    setYtOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={onPickGif}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-slate-200 transition hover:border-fuchsia-400/40 hover:text-fuchsia-200"
        >
          🔎 Add a GIF
        </button>
        <button
          type="button"
          onClick={() => {
            setYtOpen((o) => !o);
            if (!ytOpen) setTimeout(() => ytInputRef.current?.focus(), 50);
          }}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 transition ${
            ytOpen
              ? 'border-rose-400/50 bg-rose-500/10 text-rose-200'
              : 'border-white/10 bg-white/5 text-slate-200 hover:border-rose-400/40 hover:text-rose-200'
          }`}
        >
          🎬 YouTube
        </button>
        <span className="text-[11px] text-slate-500">
          Or paste any GIF / meme / YouTube link and it&apos;ll embed automatically.
        </span>
      </div>
      {ytOpen && (
        <div className="flex items-center gap-2">
          <input
            ref={ytInputRef}
            type="url"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEmbed(); } }}
            placeholder="Paste a YouTube link…"
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleEmbed}
            disabled={!isYouTubeUrl(ytUrl.trim())}
            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-500/20 disabled:opacity-40"
          >
            Embed
          </button>
          <button
            type="button"
            onClick={() => { setYtOpen(false); setYtUrl(''); }}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}
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
  onReact: (emoji: string, removing: boolean) => Promise<void> | void;
}) {
  const [overrides, setOverrides] = useState<
    Record<string, { mine: boolean; delta: number; animKey: number }>
  >({});
  // Per-emoji in-flight tracking prevents race conditions from rapid clicks.
  const [inflight, setInflight] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOverrides({});
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
        const pending = inflight.has(e);

        const handleClick = () => {
          if (pending) return;
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
          setInflight((prev) => new Set([...prev, e]));
          Promise.resolve(onReact(e, currentlyMine)).finally(() => {
            setInflight((prev) => { const s = new Set(prev); s.delete(e); return s; });
          });
        };

        return (
          <button
            key={e}
            type="button"
            onClick={handleClick}
            disabled={pending}
            className={`relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition active:scale-95 disabled:cursor-wait disabled:opacity-60 ${
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
  onSubmit: (parentId: string, name: string, content: string, attachmentIds: string[]) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Collapse logic: show last 2 by default, auto-expand if thread is active.
  const isActive = useMemo(
    () => post.comments.some(
      (c) => Date.now() - new Date(c.created_at).getTime() < 10 * 60 * 1000
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post.comments]
  );
  const [expanded, setExpanded] = useState(isActive);
  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);
  const hiddenCount = Math.max(0, post.comments.length - 2);
  const visibleComments = expanded || hiddenCount === 0
    ? post.comments
    : post.comments.slice(-2);

  if (post.moderation_status !== 'approved' && !post.is_mine) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
      {hiddenCount > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-lg py-1 text-xs text-slate-500 transition hover:text-fuchsia-400"
        >
          ↑ See {hiddenCount} earlier {hiddenCount === 1 ? 'comment' : 'comments'}
        </button>
      )}
      {visibleComments.map((c) => (
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
            if ((!content.trim() && !attachment) || busy) return;
            setBusy(true);
            setErr(null);
            try {
              const name = await requireName();
              if (!name) {
                setBusy(false);
                return;
              }
              await onSubmit(
                post.id,
                name,
                content.trim(),
                attachment ? [attachment.id] : []
              );
              setContent('');
              setAttachment(null);
            } catch (error) {
              setErr(error instanceof Error ? error.message : 'Something went wrong');
            } finally {
              setBusy(false);
            }
          }}
          className="space-y-2"
        >
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a comment… (paste a GIF / meme link too!)"
            maxLength={1000}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setGifOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-xs text-fuchsia-200 transition hover:border-fuchsia-400/70 hover:bg-fuchsia-500/20 sm:px-3"
              aria-label="Add a GIF"
            >
              🔎 GIF
            </button>
            <ImageUploadButton
              attachment={attachment}
              onChange={setAttachment}
              disabled={busy}
              compact
            />
            <button
              type="submit"
              disabled={busy || (!content.trim() && !attachment)}
              className="iz-btn-primary ml-auto rounded-lg px-2 py-1 text-xs disabled:opacity-50 sm:px-4 sm:py-1.5 sm:text-sm"
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
  onSubmit: (name: string, content: string, attachmentIds: string[]) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
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
        if ((!content.trim() && !attachment) || busy) return;
        setBusy(true);
        setErr(null);
        setOkMsg(null);
        try {
          const name = await requireName();
          if (!name) {
            setBusy(false);
            return;
          }
          await onSubmit(
            name,
            content.trim(),
            attachment ? [attachment.id] : []
          );
          setContent('');
          setAttachment(null);
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
      <MediaHelperBar onPickGif={() => setGifOpen(true)} onInsert={insertAtCursor} />
      <ImageUploadButton
        attachment={attachment}
        onChange={setAttachment}
        disabled={busy}
      />
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
          Posts require review before being public. You&apos;ll see your own
          note while it&apos;s waiting.
        </p>
        <button
          type="submit"
          disabled={busy || (!content.trim() && !attachment)}
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

const POLL_INTERVAL_MS = 15_000;
const TOAST_DURATION_MS = 2_500;

export function PublicWall() {
  const [feed, setFeed] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState('');

  // Toast: rich object with optional scroll target.
  type ToastInfo = { message: string; targetId: string | null };
  const [toast, setToast] = useState<ToastInfo | null>(null);
  // Whether to suppress all future toasts (persisted to localStorage).
  const [hideToasts, setHideToasts] = useState(false);

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the IDs we've already shown so we can detect truly new posts.
  const knownPostIds = useRef<Set<string>>(new Set());
  // Track comment counts per post so we can detect new comments on existing posts.
  const knownCommentCounts = useRef<Map<string, number>>(new Map());
  // New-post animation: IDs in this set get a slide-in CSS class for 2.5 s.
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const newPostCleanupRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Presence: named users currently on the wall.
  const [presenceUsers, setPresenceUsers] = useState<string[]>([]);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Presence popover open/close state.
  const [showOnlineList, setShowOnlineList] = useState(false);
  const onlineBadgeRef = useRef<HTMLDivElement>(null);
  // Infinite scroll: cursor-based pagination.
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreCursor = useRef<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFirstTime, setDialogFirstTime] = useState(false);
  const pendingResolver = useRef<((name: string | null) => void) | null>(null);

  useEffect(() => {
    setSavedName(readSavedName());
    setHideToasts(localStorage.getItem('iz-wall-hide-toasts') === 'true');
  }, []);

  // Keep loadMoreCursor pointing at the oldest non-optimistic post in the feed.
  useEffect(() => {
    const nonOptimistic = (feed ?? []).filter((p) => !p._optimistic);
    loadMoreCursor.current = nonOptimistic.at(-1)?.created_at ?? null;
  }, [feed]);

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
    // Update presence with the new name.
    presenceChannelRef.current?.track({ name: name || null });
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

  /** Returns true if the post card is fully or partially in the viewport. */
  const isPostVisible = useCallback((id: string): boolean => {
    const el = document.getElementById(`post-${id}`);
    if (!el) return false;
    const { top, bottom } = el.getBoundingClientRect();
    return top < window.innerHeight && bottom > 0;
  }, []);

  const scrollToTarget = useCallback((id: string | null) => {
    if (!id) return;
    document.getElementById(`post-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const hideToastsForever = useCallback(() => {
    localStorage.setItem('iz-wall-hide-toasts', 'true');
    setHideToasts(true);
    dismissToast();
  }, [dismissToast]);

  const showToast = useCallback((message: string, targetId: string | null = null) => {
    setToast({ message, targetId });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await fetch('/api/wall/feed?limit=10', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error(`Feed failed (${res.status})`);
      const json = await res.json();
      const incoming = (json.feed as Post[]) ?? [];

      setFeed((prev) => {
        if (!prev) {
          // First load — seed known IDs and comment counts.
          for (const p of incoming) {
            knownPostIds.current.add(p.id);
            knownCommentCounts.current.set(p.id, p.comments?.length ?? 0);
          }
          return incoming;
        }

        // All posts not previously seen (includes my newly approved posts + others' new posts).
        const trulyNew = incoming.filter((p) => !knownPostIds.current.has(p.id));
        // Notifications/animation: only posts from others.
        const newFromOthers = trulyNew.filter((p) => !p.is_mine);
        if (!silent && newFromOthers.length > 0) {
          const targetId = newFromOthers[0].id;
          const count = newFromOthers.length;
          const msg = count === 1 ? '✨ 1 new post on the wall!' : `✨ ${count} new posts on the wall!`;
          // Only toast if the first new post is off-screen.
          if (!hideToasts && !isPostVisible(targetId)) {
            showToast(msg, targetId);
          }
          const newIds = new Set(newFromOthers.map((p) => p.id));
          setNewPostIds((prev) => new Set([...prev, ...newIds]));
          for (const id of newIds) {
            const existing = newPostCleanupRef.current.get(id);
            if (existing) clearTimeout(existing);
            const t = setTimeout(() => {
              setNewPostIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
              newPostCleanupRef.current.delete(id);
            }, 2500);
            newPostCleanupRef.current.set(id, t);
          }
        }

        // Detect new comments on existing posts.
        if (!silent) {
          for (const p of incoming) {
            if (knownPostIds.current.has(p.id) && !p.is_mine) {
              const prevCount = knownCommentCounts.current.get(p.id) ?? 0;
              const newCount = p.comments?.length ?? 0;
              if (newCount > prevCount) {
                // New comment(s) arrived on this post — animate the card.
                setNewPostIds((prev) => new Set([...prev, p.id]));
                const existing = newPostCleanupRef.current.get(p.id);
                if (existing) clearTimeout(existing);
                const t = setTimeout(() => {
                  setNewPostIds((prev) => { const s = new Set(prev); s.delete(p.id); return s; });
                  newPostCleanupRef.current.delete(p.id);
                }, 2500);
                newPostCleanupRef.current.set(p.id, t);
                // Toast only if the post card is off-screen.
                if (!hideToasts && !isPostVisible(p.id)) {
                  showToast('💬 New comment on the wall!', p.id);
                }
              }
            }
          }
        }

        // Update known comment counts for all visible posts.
        for (const p of incoming) {
          knownPostIds.current.add(p.id);
          knownCommentCounts.current.set(p.id, p.comments?.length ?? 0);
        }

        // Keep optimistic items not yet confirmed server-side.
        const keepers = prev.filter(
          (p) =>
            p._optimistic &&
            !incoming.some((q) => q.content === p.content && q.is_mine && q.parent_post_id === null)
        );

        // Merge: update existing visible posts with fresh data, preserve older loaded pages.
        const incomingMap = new Map(incoming.map((p) => [p.id, p]));
        const updatedPrev = prev
          .filter((p) => !p._optimistic)
          .map((p) => incomingMap.get(p.id) ?? p);

        return [...keepers, ...trulyNew, ...updatedPrev];
      });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load wall');
    }
  }, [showToast, hideToasts, isPostVisible]);

  // Initial load
  useEffect(() => {
    refresh({ silent: true });
  }, [refresh]);

  const loadMore = useCallback(async () => {
    const cursor = loadMoreCursor.current;
    if (!canLoadMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/wall/feed?limit=10&before=${encodeURIComponent(cursor)}`,
        { cache: 'no-store', credentials: 'include' }
      );
      if (!res.ok) return;
      const json = await res.json();
      const incoming = (json.feed as Post[]) ?? [];
      if (incoming.length < 10) setCanLoadMore(false);
      for (const p of incoming) knownPostIds.current.add(p.id);
      setFeed((prev) => {
        if (!prev) return incoming;
        const existingIds = new Set(prev.map((p) => p.id));
        const toAdd = incoming.filter((p) => !existingIds.has(p.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [canLoadMore, loadingMore]);

  // Trigger loadMore when the sentinel scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !canLoadMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore, canLoadMore]);

  // 15-second fallback poll (handles missed realtime events)
  useEffect(() => {
    const id = setInterval(() => refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Supabase Realtime subscription — triggers an immediate refresh when any
  // approved post is inserted or updated in the database.
  useEffect(() => {
    const channel = supabase
      .channel('public-wall-posts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: 'moderation_status=eq.approved',
        },
        () => {
          // Don't read payload — always fetch via the enriched API.
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Supabase Realtime presence — tracks named users currently on the wall.
  useEffect(() => {
    const ch = supabase.channel('wall-presence');
    presenceChannelRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ name: string | null }>();
      const names = Object.values(state)
        .flat()
        .map((u) => u.name)
        .filter((n): n is string => typeof n === 'string' && n.length > 0);
      setPresenceUsers([...new Set(names)]);
    });
    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const name = readSavedName();
        await ch.track({ name: name || null });
      }
    });
    return () => {
      supabase.removeChannel(ch);
      presenceChannelRef.current = null;
    };
  }, []);

  // Close the online list on outside click or Escape.
  useEffect(() => {
    if (!showOnlineList) return;
    const handleDown = (e: MouseEvent) => {
      if (onlineBadgeRef.current && !onlineBadgeRef.current.contains(e.target as Node)) {
        setShowOnlineList(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowOnlineList(false);
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showOnlineList]);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(refresh, 400);
  }, [refresh]);

  const submitPost = useCallback(
    async (name: string, content: string, attachmentIds: string[]) => {
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
        attachments: [],
        _optimistic: true,
      };
      setFeed((prev) => (prev ? [optimistic, ...prev] : [optimistic]));

      try {
        const res = await fetch('/api/wall/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            author_name: name || undefined,
            content,
            attachment_ids: attachmentIds.length ? attachmentIds : undefined,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // remove the optimistic row
          setFeed((prev) => prev?.filter((p) => p.id !== tempId) ?? null);
          if (res.status === 429) throw new Error('You\u2019re posting a bit too fast — try again in a bit.');
          if (res.status === 409 && body?.error === 'name_taken')
            throw new Error('That name is being used by someone else right now. Try a different one!');
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
    async (parentId: string, name: string, content: string, attachmentIds: string[]) => {
      const res = await fetch('/api/wall/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parent_post_id: parentId,
          author_name: name || undefined,
          content,
          attachment_ids: attachmentIds.length ? attachmentIds : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body?.error === 'name_taken')
          throw new Error('That name is being used by someone else right now. Try a different one!');
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
    <>
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-4 sm:max-w-2xl sm:py-8 lg:max-w-3xl">
      {/* Arrival animation keyframes — scoped to this component */}
      <style>{`
        @keyframes iz-post-arrive {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .iz-post-arrive {
          animation: iz-post-arrive 0.45s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 0 0 2px rgba(192,132,252,0.25);
        }
        @keyframes iz-toast-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
      `}</style>
      <NameDialog
        open={dialogOpen}
        initialName={savedName}
        firstTime={dialogFirstTime}
        onCancel={handleDialogCancel}
        onSubmit={handleDialogSubmit}
      />

      {/* Live-update toast — clickable, dismissable, with opt-out */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex w-auto max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-1"
          style={{ animation: 'iz-toast-up 0.3s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-slate-900/95 pl-3 pr-1.5 py-1.5 shadow-lg backdrop-blur sm:pl-5 sm:pr-2 sm:py-2.5">
            <button
              type="button"
              onClick={() => { scrollToTarget(toast.targetId); dismissToast(); }}
              className="text-sm font-medium text-fuchsia-200 hover:text-white focus:outline-none"
            >
              {toast.message}
            </button>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss"
              className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-200 focus:outline-none"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={hideToastsForever}
            className="text-xs text-slate-600 transition hover:text-slate-400 focus:outline-none"
          >
            Hide these
          </button>
        </div>
      )}

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
            id={`post-${p.id}`}
            className={`rounded-2xl border p-3 backdrop-blur sm:p-4 ${
              newPostIds.has(p.id) ? 'iz-post-arrive' : ''
            } ${
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

        {/* Infinite scroll: loading spinner */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-fuchsia-400" />
          </div>
        )}

        {/* Sentinel element — IntersectionObserver triggers loadMore when visible */}
        {canLoadMore && <div ref={sentinelRef} className="h-1" />}

        {/* End of feed */}
        {!canLoadMore && feed !== null && items.length > 0 && (
          <p className="py-6 text-center text-xs text-slate-600">You&apos;ve seen it all 🎉</p>
        )}
      </div>
    </div>

    {/* Who's online badge — fixed top-left, compact count pill with tap-to-expand popover */}
    {presenceUsers.length > 0 && (
      <div ref={onlineBadgeRef} className="fixed left-4 top-3 z-30">
        <button
          type="button"
          onClick={() => setShowOnlineList((o) => !o)}
          aria-expanded={showOnlineList}
          aria-label={`${presenceUsers.length} people online — tap to see who`}
          className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-slate-900/90 px-2.5 py-1 text-xs text-emerald-300 shadow-md backdrop-blur-md transition hover:border-emerald-400/50"
        >
          <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
          <span className="font-medium">{presenceUsers.length}</span>
        </button>
        {showOnlineList && (
          <div className="absolute left-0 top-9 min-w-[140px] max-w-[200px] rounded-xl border border-emerald-400/20 bg-slate-900/95 px-2.5 py-2 shadow-xl backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Online now
              </span>
              <button
                type="button"
                onClick={() => setShowOnlineList(false)}
                aria-label="Close"
                className="ml-2 flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
              >
                ×
              </button>
            </div>
            <ul className="m-0 list-none p-0">
              {presenceUsers.map((name) => (
                <li key={name} className="flex items-center gap-1.5 py-0.5 text-xs text-emerald-200">
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
    </>
  );
}
