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
          setIsAuthorized(false);
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
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="iz-card p-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Compose is for Isla only
          </h1>
          <p className="text-slate-400 mb-6">
            The Compose page is used by the Isla account to broadcast updates to
            every family. Your account doesn&apos;t have that role.
          </p>
          <a href="/dashboard" className="iz-btn-primary inline-block">
            Back to dashboard
          </a>
        </div>
      </div>
    );
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
