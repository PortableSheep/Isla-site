'use client';

import { ChildStatus } from '@/types/child';

interface StatusBadgeProps {
  status: ChildStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/50';
      case 'active':
        return 'bg-green-900/30 text-green-200 border border-green-700/50';
      case 'rejected':
        return 'bg-red-900/30 text-red-200 border border-red-700/50';
      case 'suspended':
        return 'bg-orange-900/30 text-orange-200 border border-orange-700/50';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'active':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  );
}
