'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ReplyComposerProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  autoFocus?: boolean;
}

const MAX_REPLY_LENGTH = 2000;
const WARNING_THRESHOLD = 0.8;

export function ReplyComposer({
  onSubmit,
  onCancel,
  loading = false,
  autoFocus = true,
}: ReplyComposerProps) {
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_REPLY_LENGTH) {
      setContent(newContent);
      setCharCount(newContent.length);
      setError(null);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      setError(null);
      
      if (!content.trim()) {
        setError('Reply cannot be empty');
        return;
      }

      if (content.length > MAX_REPLY_LENGTH) {
        setError(`Reply cannot exceed ${MAX_REPLY_LENGTH} characters`);
        return;
      }

      await onSubmit(content.trim());
      setContent('');
      setCharCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
    }
  };

  const percentUsed = charCount / MAX_REPLY_LENGTH;
  const isWarning = percentUsed >= WARNING_THRESHOLD;

  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Write your reply..."
          disabled={loading}
          rows={4}
          className={`w-full rounded border-2 bg-slate-800 p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-0 transition-colors ${
            isWarning && charCount > 0
              ? 'border-yellow-500'
              : 'border-slate-600 focus:border-blue-500'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium ${
          isWarning && charCount > 0
            ? 'text-yellow-400'
            : 'text-gray-400'
        }`}>
          {charCount} / {MAX_REPLY_LENGTH}
          {isWarning && charCount > 0 && ' (approaching limit)'}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
