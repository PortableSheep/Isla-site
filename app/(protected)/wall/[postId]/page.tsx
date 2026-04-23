'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getPost, getThreadReplies } from '@/lib/posts';
import { Post } from '@/types/posts';
import Link from 'next/link';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (postId) {
      loadThreadData();
    }
  }, [postId]);

  const loadThreadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/auth/login');
        return;
      }

      // Get post
      const post = await getPost(postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      setPost(post);

      // Get replies
      const replies = await getThreadReplies(postId);
      setReplies(replies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
      console.error('Error loading thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submitLoading) return;

    try {
      setSubmitLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const newReply = await response.json();
      setReplies((prev) => [...prev, newReply]);
      setReplyContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-6 text-red-300">
          {error || 'Post not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Original Post */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 mb-6">
        <div className="mb-4">
          <p className="text-gray-100 whitespace-pre-wrap">{post.content}</p>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(post.created_at).toLocaleString()}
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="text-sm font-semibold text-gray-300">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </div>
          {replies.map((reply) => (
            <div key={reply.id} className="border-l-2 border-slate-600 pl-4 py-3">
              <p className="text-gray-100 text-sm whitespace-pre-wrap">{reply.content}</p>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(reply.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Composer */}
      <form onSubmit={handleSubmitReply} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value.slice(0, 2000))}
          placeholder="Write your reply..."
          disabled={submitLoading}
          rows={4}
          maxLength={2000}
          className="w-full rounded border-2 border-slate-600 bg-slate-800 p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-gray-400">
            {replyContent.length} / 2000
          </div>
          <button
            type="submit"
            disabled={submitLoading || !replyContent.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitLoading ? 'Posting...' : 'Reply'}
          </button>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
