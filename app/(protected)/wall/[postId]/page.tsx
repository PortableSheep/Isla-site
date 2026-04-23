'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getPost, getRepliesWithAuthors } from '@/lib/posts';
import { Post } from '@/types/posts';
import { ThreadView } from '@/components/wall/ThreadView';
import Link from 'next/link';

interface PageProps {
  params: {
    postId: string;
  };
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [familyId, setFamilyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThreadData();
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

      setCurrentUserId(user.id);

      // Get post
      const post = await getPost(postId);
      if (!post) {
        setError('Post not found');
        return;
      }

      setPost(post);
      setFamilyId(post.family_id);

      // Get replies with author info
      const replies = await getRepliesWithAuthors(postId);
      setReplies(replies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
      console.error('Error loading thread:', err);
    } finally {
      setLoading(false);
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
          href={`/wall/${familyId || 'dashboard'}`}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Wall
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
        href={`/wall/${familyId}`}
        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Wall
      </Link>

      {/* Thread View */}
      <ThreadView
        post={post}
        initialReplies={replies}
        currentUserId={currentUserId}
        familyId={familyId}
        onPostDeleted={() => router.push(`/wall/${familyId}`)}
      />
    </div>
  );
}
