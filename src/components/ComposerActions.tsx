'use client';

import { useState } from 'react';

interface ComposerActionsProps {
  content: string;
  isUpdate: boolean;
  isLoading?: boolean;
  onPublish: () => Promise<void>;
  onCancel: () => void;
  successMessage?: string;
}

export function ComposerActions({
  content,
  isUpdate,
  isLoading = false,
  onPublish,
  onCancel,
  successMessage,
}: ComposerActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const isValid = content.trim().length > 0 && content.trim().length <= 5000;

  const handlePublish = async () => {
    setError(null);
    try {
      await onPublish();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish post';
      setError(message);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-900/30 border border-green-700 text-green-200 px-4 py-2 rounded">
          {successMessage || 'Post published successfully!'}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={!isValid || isLoading}
          className={`flex-1 px-6 py-2 rounded-lg font-medium transition-colors ${
            isValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⚙️</span>
              Publishing...
            </span>
          ) : (
            '✓ Publish'
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
