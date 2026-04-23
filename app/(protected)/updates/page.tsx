'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Post } from '@/types/posts';
import { UpdateCard } from '@/components/wall/UpdateCard';

export default function UpdatesPage() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredUpdates, setFilteredUpdates] = useState<Post[]>([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        setError(null);

        const endpoint = searchQuery.trim()
          ? `/api/posts/updates?search=${encodeURIComponent(searchQuery)}`
          : '/api/posts/updates';

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error('Failed to fetch updates');
        }

        const data = await response.json();
        const updatesList = Array.isArray(data) ? data : data.updates || [];

        setUpdates(updatesList);
        setFilteredUpdates(updatesList);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load updates');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUpdates();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleDeleteUpdate = async (updateId: string) => {
    if (!window.confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${updateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete update');
      }

      setUpdates(updates.filter((u) => u.id !== updateId));
      setFilteredUpdates(filteredUpdates.filter((u) => u.id !== updateId));
    } catch (err) {
      console.error('Error deleting update:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete update');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-8 text-center">
          <p className="text-blue-300 mb-4">Please sign in to view updates</p>
          <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          📢 Isla Updates
        </h1>
        <p className="text-gray-400">
          Browse all announcements and updates from Isla
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-gray-400">Loading updates...</p>
          </div>
        </div>
      )}

      {/* No Updates */}
      {!loading && filteredUpdates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-400 mb-2">
            {searchQuery ? 'No updates match your search' : 'No updates yet'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Updates List */}
      {!loading && filteredUpdates.length > 0 && (
        <div>
          <div className="text-sm text-gray-400 mb-6">
            Showing {filteredUpdates.length} {filteredUpdates.length === 1 ? 'update' : 'updates'}
          </div>

          <div className="space-y-4">
            {filteredUpdates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                isAuthor={user.id === update.author_id}
                onDelete={user.id === update.author_id ? () => handleDeleteUpdate(update.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
