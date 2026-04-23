'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getPostsByFamily, getUpdates } from '@/lib/posts';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  family_id: string | null;
  author_id: string;
  content: string;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hidden: boolean;
  flagged: boolean;
  flag_count: number;
  is_update: boolean;
}

interface WallFeedProps {
  familyId: string;
  isModerator: boolean;
}

export function WallFeed({ familyId, isModerator }: WallFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [updates, setUpdates] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyCount, setReplyCount] = useState<Record<string, number>>({});

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regular posts (non-updates)
      const data = await getPostsByFamily(familyId, 50, 0);
      const regularPosts = data.filter(p => !p.is_update);
      setPosts(regularPosts);

      // Fetch updates
      const updatesData = await getUpdates(50, 0);
      setUpdates(updatesData);

      // Fetch reply counts for each regular post
      const counts: Record<string, number> = {};
      for (const post of regularPosts) {
        const { data: replies, error: repliesError } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('parent_post_id', post.id)
          .is('deleted_at', null);

        if (!repliesError) {
          counts[post.id] = replies?.length || 0;
        }
      }
      setReplyCount(counts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchPosts();
  }, [familyId, fetchPosts]);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          content: newPostContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      setNewPostContent('');
      await fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <form onSubmit={handleSubmitPost} className="space-y-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="Share something with your family..."
            maxLength={5000}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            rows={4}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {newPostContent.length} / 5000
            </span>
            <button
              type="submit"
              disabled={submitting || !newPostContent.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Updates Section */}
      {!loading && updates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              📢 Latest Updates
            </h2>
            {updates.length > 3 && (
              <Link href="/updates" className="text-amber-400 hover:text-amber-300 text-sm font-medium">
                View all →
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {updates.slice(0, 3).map((update) => (
              <Link key={update.id} href={`/updates`}>
                <div className="group cursor-pointer bg-gradient-to-r from-amber-900/60 to-amber-800/40 border border-amber-600/30 hover:border-amber-500/60 rounded-lg p-4 transition-all hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block bg-amber-500 text-amber-950 px-2 py-0.5 rounded text-xs font-bold">
                          UPDATE
                        </span>
                        <span className="text-xs text-amber-200/70">
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-amber-50 line-clamp-2 group-hover:text-white transition-colors">
                        {update.content}
                      </p>
                    </div>
                    <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.length === 0 && updates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No posts yet. Be the first to share!</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {updates.length > 0 ? 'Family Posts' : 'Recent Posts'}
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition"
              >
                <p className="text-white mb-2 line-clamp-3">{post.content}</p>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                  {post.flagged && (
                    <span className="text-yellow-600">🚩 Flagged</span>
                  )}
                </div>

                {/* Reply Link */}
                <Link
                  href={`/wall/${post.id}`}
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0 0l6-6"
                    />
                  </svg>
                  {replyCount[post.id] || 0} {replyCount[post.id] === 1 ? 'Reply' : 'Replies'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
