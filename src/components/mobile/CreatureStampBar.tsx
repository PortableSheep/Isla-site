'use client';

import React from 'react';
import { CreatureDisplay } from '@/components/CreatureDisplay';

interface CreatureStampBarProps {
  onSelectStamp: (stampId: string, stampLabel: string) => void;
  activeStamps?: string[];
}

const STAMPS = [
  { id: 'glimmer_love', creatureId: 'glimmer', state: 'happy' as const, anim: 'bounce' as const, emoji: '💖', label: 'Love' },
  { id: 'sparkle_party', creatureId: 'sparkle', state: 'celebrating' as const, anim: 'celebrate' as const, emoji: '🎉', label: 'Party' },
  { id: 'pixel_proud', creatureId: 'pixel', state: 'proud' as const, anim: 'nod' as const, emoji: '🌟', label: 'Proud' },
  { id: 'drift_hug', creatureId: 'drift', state: 'happy' as const, anim: 'gentle_bounce' as const, emoji: '🤗', label: 'Hugs' }
];

export const CreatureStampBar: React.FC<CreatureStampBarProps> = ({
  onSelectStamp,
  activeStamps = []
}) => {
  const handleStampClick = (stampId: string, label: string) => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try { navigator.vibrate(20); } catch {}
    }
    onSelectStamp(stampId, label);
  };

  return (
    <div className="flex items-center space-x-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none select-none">
      {STAMPS.map((stamp) => {
        const isActive = activeStamps.includes(stamp.id);
        return (
          <button
            key={stamp.id}
            onClick={() => handleStampClick(stamp.id, stamp.label)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 flex-shrink-0 border ${
              isActive
                ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-400 text-purple-700 dark:text-purple-300 ring-2 ring-purple-400/30'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700'
            }`}
          >
            <CreatureDisplay
              creatureId={stamp.creatureId}
              state={stamp.state}
              animation={stamp.anim}
              size="small"
            />
            <span>{stamp.emoji} {stamp.label}</span>
          </button>
        );
      })}
    </div>
  );
};
