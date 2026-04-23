'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/types/posts';

interface EditUpdateModalProps {
  update: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}

export function EditUpdateModal({
  update,
  isOpen,
  onClose,
  onSave,
}: EditUpdateModalProps) {
  const [content, setContent] = useState(update.content);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContent(update.content);
    setError(null);
  }, [update, isOpen]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    if (content.length > 3000) {
      setError('Update content cannot exceed 3000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-amber-600/50">
        <h2 className="text-2xl font-bold text-amber-300 mb-4">Edit Update</h2>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[300px] p-4 rounded-lg border-2 border-amber-600/30 bg-slate-800 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500 focus:ring-0 transition-colors"
          placeholder="Edit your update..."
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {content.length} / 3000 characters
            {content.length > 2400 && (
              <span className="text-amber-400 ml-2">⚠️ Approaching limit</span>
            )}
            {content.length > 3000 && (
              <span className="text-red-400 ml-2">❌ Exceeds limit</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !content.trim() || content.length > 3000}
              className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Saving...
                </>
              ) : (
                '💾 Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
