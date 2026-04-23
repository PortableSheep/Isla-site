'use client';

import { useEffect, useState } from 'react';
import { ChildProfile } from '@/types/child';
import { ChildList } from '@/components/ChildList';
import Link from 'next/link';

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/children/my-children');

        if (!response.ok) {
          throw new Error('Failed to fetch children');
        }

        const data = await response.json();
        setChildren(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch children';
        setError(message);
        setChildren([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildren();
  }, []);

  const handleDelete = async (childId: string) => {
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete child profile');
      }

      setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Children</h1>
          <p className="text-gray-400">Manage your children's profiles and access</p>
        </div>
        <Link
          href="/children/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Add Child
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Children list */}
      <ChildList children={children} onDelete={handleDelete} isLoading={isLoading} />
    </div>
  );
}
