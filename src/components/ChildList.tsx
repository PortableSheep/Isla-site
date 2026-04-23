'use client';

import { ChildProfile } from '@/types/child';
import { StatusBadge } from './StatusBadge';
import Link from 'next/link';
import { useState } from 'react';

interface ChildListProps {
  children: ChildProfile[];
  onDelete?: (childId: string) => Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ChildList({
  children,
  onDelete,
  isLoading = false,
  emptyMessage = 'No children found. Create your first child profile!',
}: ChildListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (childId: string) => {
    if (!onDelete) return;

    if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setDeletingId(childId);
    setDeleteError(null);

    try {
      await onDelete(childId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete profile');
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading children...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{emptyMessage}</p>
        <Link href="/children/new" className="text-blue-400 hover:text-blue-300">
          Create Child Profile →
        </Link>
      </div>
    );
  }

  // Sort by created_at, pending first
  const sorted = [...children].sort((a, b) => {
    const statusOrder = { pending_approval: 0, active: 1, rejected: 2, suspended: 3 };
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{deleteError}</p>
        </div>
      )}

      <div className="grid gap-4">
        {sorted.map((child) => (
          <div
            key={child.id}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{child.name}</h3>
                  <StatusBadge status={child.status} />
                </div>

                <div className="space-y-1 text-sm text-gray-400">
                  {child.age && <p>Age: {child.age} years old</p>}
                  {child.bio && <p className="mt-2 text-gray-300">{child.bio}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(child.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {child.status === 'pending_approval' && (
                  <>
                    <Link
                      href={`/children/${child.id}/edit`}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(child.id)}
                      disabled={deletingId === child.id}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition"
                    >
                      {deletingId === child.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
                {child.status !== 'pending_approval' && (
                  <Link
                    href={`/children/${child.id}`}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
