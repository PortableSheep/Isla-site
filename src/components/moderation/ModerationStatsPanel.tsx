'use client';

import { useMemo } from 'react';
import { ModerationStats } from '@/types/moderation';

interface ModerationStatsProps {
  stats: ModerationStats;
  isLoading?: boolean;
}

export function ModerationStatsPanel({ stats, isLoading }: ModerationStatsProps) {
  const resolved = useMemo(() => stats.reviewed_flags + stats.dismissed_flags, [stats]);

  const statCards = [
    {
      label: 'Total Flags',
      value: stats.total_flags,
      color: 'bg-blue-900/30 border-blue-700',
      icon: '🚩',
    },
    {
      label: 'Pending',
      value: stats.pending_flags,
      color: 'bg-red-900/30 border-red-700',
      icon: '⏳',
    },
    {
      label: 'Resolved',
      value: resolved,
      color: 'bg-green-900/30 border-green-700',
      icon: '✅',
    },
    {
      label: 'Dismissed',
      value: stats.dismissed_flags,
      color: 'bg-gray-900/30 border-gray-700',
      icon: '✋',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((card) => (
        <div
          key={card.label}
          className={`${card.color} border rounded-lg p-6 transition-all ${
            isLoading ? 'opacity-50' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-300">{card.label}</h3>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {isLoading ? '...' : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
