'use client';

import { useEffect, useState, useCallback } from 'react';
import { FlaggedPostData, FlagStatus, ModerationStats } from '@/types/moderation';
import { ModerationFilters } from './ModerationFilters';
import { FlaggedPostCard } from './FlaggedPostCard';
import { ModerationStatsPanel } from './ModerationStatsPanel';

export function ModerationDashboard() {
  const [posts, setPosts] = useState<FlaggedPostData[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total_flags: 0,
    pending_flags: 0,
    reviewed_flags: 0,
    dismissed_flags: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<FlagStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flagged posts
  const fetchPosts = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/admin/flags?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flagged posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching posts:', err);
    }
  }, [selectedStatus, searchQuery]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPosts(), fetchStats()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPosts();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPosts, fetchStats]);
  const handleStatusChange = async (flagId: string, status: FlagStatus) => {
    try {
      const response = await fetch(`/api/admin/flags/${flagId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update flag status');
      }

      // Refresh posts and stats
      await fetchPosts();
      await fetchStats();
    } catch (err) {
      console.error('Error updating flag status:', err);
      alert('Failed to update flag status');
    }
  };

  // Handle hide post
  const handleHidePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to hide post');
      }

      // Refresh posts
      await fetchPosts();
    } catch (err) {
      console.error('Error hiding post:', err);
      alert('Failed to hide post');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Refresh posts
      await fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Moderation Queue</h1>
        <p className="text-gray-400">
          Review and manage flagged posts from the community
        </p>
      </div>

      {/* Statistics */}
      <ModerationStatsPanel stats={stats} isLoading={isLoading} />

      {/* Filters */}
      <ModerationFilters
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onStatusChange={setSelectedStatus}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Posts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Loading flagged posts...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Flagged Posts</h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'No flagged posts match your search'
              : selectedStatus !== 'all'
              ? `No flagged posts with status "${selectedStatus}"`
              : 'All posts are compliant!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FlaggedPostCard
              key={post.id}
              post={post}
              onStatusChange={handleStatusChange}
              onHidePost={handleHidePost}
              onDeletePost={handleDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
