'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const EMOJIS = ['❤️', '😂', '😮', '🎉', '👍'];

interface ReactionRow {
  emoji: string;
  user_id: string;
}

export function ReactionBar({ postId }: { postId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('post_reactions')
        .select('emoji, user_id')
        .eq('post_id', postId);
      if (cancelled || error || !data) return;

      const nextCounts: Record<string, number> = {};
      const nextMine = new Set<string>();
      for (const row of data as ReactionRow[]) {
        nextCounts[row.emoji] = (nextCounts[row.emoji] ?? 0) + 1;
        if (user?.id && row.user_id === user.id) nextMine.add(row.emoji);
      }
      setCounts(nextCounts);
      setMine(nextMine);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const toggle = async (emoji: string) => {
    if (!userId || busy) return;
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
      if (hasMine) {
        await fetch(
          `/api/reactions?postId=${encodeURIComponent(postId)}&emoji=${encodeURIComponent(emoji)}`,
          { method: 'DELETE' }
        );
      } else {
        await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, emoji }),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = mine.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            disabled={!userId || busy}
            className={`px-2.5 py-1 rounded-full border text-sm transition ${
              active
                ? 'bg-pink-500/20 border-pink-400/60 text-pink-200'
                : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-500'
            } disabled:opacity-50`}
          >
            <span className="mr-1">{emoji}</span>
            <span className="text-xs">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
