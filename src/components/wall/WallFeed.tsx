'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post } from '@/types/posts';
import { getPostsByFamily } from '@/lib/posts';
import { useAuth } from '@/lib/AuthContext';
import { PostCard } from './PostCard';

const POSTS_PER_PAGE = 20;

interface WallFeedProps {
  familyId: string;
  isModerator?: boolean;
}

interface PostWithAuthorInfo extends Post {
  authorEmail?: string;
  authorRole?: 'parent' | 'child' | 'admin';
  replyCount?: number;
}

export function WallFeed({ familyId, isModerator = false }: WallFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Fetch posts
  const fetchPosts = useCallback(
    async (currentOffset: number = 0) => {
      try {
        setError(null);
        const newPosts = await getPostsByFamily(familyId, POSTS_PER_PAGE, currentOffset);

        // Fetch author info for posts
        const postsWithAuthor = await Promise.all(
          newPosts.map(async (post) => {
            // For now, use email from post (would need author_email from API)
            return {
              ...post,
              authorEmail: `user-${post.author_id.slice(0, 8)}@family.local`,
              authorRole: 'child' as const,
              replyCount: 0,
            };
          })
        );

        if (currentOffset === 0) {
          setPosts(postsWithAuthor);
        } else {
          setPosts((prev) => [...prev, ...postsWithAuthor]);
        }

        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setOffset(currentOffset + POSTS_PER_PAGE);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        if (currentOffset === 0) {
          setLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [familyId]
  );

  // Initial load
  useEffect(() => {
    fetchPosts(0);
  }, [familyId, fetchPosts]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchPosts(offset);
  };

  const handlePostRefresh = () => {
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    fetchPosts(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={() => handlePostRefresh()}
          className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-12 text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 19V7a2 2 0 012-2h6a2 2 0 012 2v12M7 19l2-2m0 0l-2-2m0 2h12m0-2l-2 2m0 0l2-2m0 2h-8" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No posts yet</h3>
        <p className="text-gray-400">Be the first to share something with your family!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            authorEmail={post.authorEmail || 'Unknown'}
            authorRole={post.authorRole || 'child'}
            isAuthor={user?.id === post.author_id}
            isModerator={isModerator}
            replyCount={post.replyCount}
            onReplyClick={() => {
              // TODO: Navigate to reply composer
              console.log('Reply to post:', post.id);
            }}
            onFlagSuccess={() => {
              handlePostRefresh();
            }}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="mt-8 text-center text-gray-400 text-sm">
          All posts loaded ({posts.length} total)
        </div>
      )}
    </div>
  );
}
