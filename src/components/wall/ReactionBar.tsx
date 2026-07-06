'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  WALL_REACTION_OPTIONS,
  WALL_REACTION_BY_ID,
} from '@/lib/wallReactions';

interface ReactionRow {
  emoji: string;
}

export function ReactionBar({ postId }: { postId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('emoji')
        .eq('post_id', postId);
      if (cancelled || error || !data) return;

      const nextCounts: Record<string, number> = {};
      for (const row of data as ReactionRow[]) {
        nextCounts[row.emoji] = (nextCounts[row.emoji] ?? 0) + 1;
      }
      setCounts(nextCounts);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const toggle = async (emoji: string) => {
    if (busy) return;
    setBusy(true);
    const hasMine = mine.has(emoji);

    // Optimistic update.
    setMine((prev) => {
      const next = new Set(prev);
      if (hasMine) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
    setCounts((prev) => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (hasMine ? -1 : 1)),
    }));

    try {
      await fetch('/api/wall/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ post_id: postId, emoji, toggle: hasMine }),
      });
    } finally {
      setBusy(false);
    }
  };

  const reactionIds = [
    ...WALL_REACTION_OPTIONS.map((reaction) => reaction.id),
    ...Object.keys(counts).filter(
      (reactionId) => !WALL_REACTION_BY_ID.has(reactionId)
    ),
  ];

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
      {reactionIds.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = mine.has(emoji);
        const reaction = WALL_REACTION_BY_ID.get(emoji);
        const symbol = reaction?.symbol ?? emoji;
        const label = reaction?.label ?? emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            disabled={busy}
            className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-pink-500/20 border-pink-400/60 text-pink-200'
                : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-500'
            } disabled:opacity-50`}
            aria-label={`${label}${count ? `, ${count} total` : ''}`}
            aria-pressed={active}
          >
            <span>{symbol}</span>
            <span className="text-xs">{count}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
