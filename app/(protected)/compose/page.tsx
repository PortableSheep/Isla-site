'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PostComposer } from '@/components/PostComposer';
import { ComposerActions } from '@/components/ComposerActions';
import { isIslaUser } from '@/lib/islaUser';
import { getCurrentUser } from '@/lib/auth';

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const isIsla = await isIslaUser(user.id);
        if (!isIsla) {
          router.push('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthorization();
  }, [router]);

  const handlePublish = async () => {
    if (!content.trim()) {
      throw new Error('Content cannot be empty');
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          is_update: isUpdate,
          is_isla_post: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish post');
      }

      const post = await response.json();

      // Clear draft and reset form
      localStorage.removeItem('post_draft');
      setContent('');
      setIsUpdate(false);

      // Show success and redirect after a brief moment
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim()) {
      const confirmed = window.confirm(
        'Discard draft? Your text will be saved to localStorage but the page will reset.'
      );
      if (!confirmed) return;
    }
    setContent('');
    setIsUpdate(false);
    router.push('/');
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">✨ Compose Message</h1>
        <p className="text-gray-400">Share an update with all families</p>
      </div>

      <div className="bg-slate-800 rounded-lg p-6 space-y-6">
        <PostComposer
          onContentChange={setContent}
          isUpdate={isUpdate}
          onUpdateToggle={setIsUpdate}
          disabled={isLoading}
        />

        <ComposerActions
          content={content}
          isUpdate={isUpdate}
          isLoading={isLoading}
          onPublish={handlePublish}
          onCancel={handleCancel}
          successMessage="✅ Message published to all families!"
        />
      </div>
    </div>
  );
}
