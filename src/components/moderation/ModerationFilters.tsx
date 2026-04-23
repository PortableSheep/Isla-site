'use client';

import { FlagStatus } from '@/types/moderation';

interface ModerationFiltersProps {
  selectedStatus: FlagStatus | 'all';
  searchQuery: string;
  onStatusChange: (status: FlagStatus | 'all') => void;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

const statuses: Array<{ value: FlagStatus | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'All', color: 'gray' },
  { value: 'pending', label: 'Pending', color: 'red' },
  { value: 'reviewed', label: 'In Review', color: 'yellow' },
  { value: 'dismissed', label: 'Dismissed', color: 'green' },
];

export function ModerationFilters({
  selectedStatus,
  searchQuery,
  onStatusChange,
  onSearchChange,
  isLoading,
}: ModerationFiltersProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search flagged posts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const isSelected = selectedStatus === status.value;
          const bgColor = isSelected
            ? status.value === 'pending'
              ? 'bg-red-600'
              : status.value === 'reviewed'
              ? 'bg-yellow-600'
              : status.value === 'dismissed'
              ? 'bg-green-600'
              : 'bg-blue-600'
            : 'bg-gray-800 hover:bg-gray-700';

          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${bgColor} border ${
                isSelected ? 'border-white' : 'border-gray-600'
              } text-white disabled:opacity-50`}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
