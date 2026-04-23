'use client';

import { useState, useCallback, useEffect } from 'react';

interface PostComposerProps {
  onContentChange: (content: string) => void;
  isUpdate?: boolean;
  onUpdateToggle?: (isUpdate: boolean) => void;
  disabled?: boolean;
}

const MAX_CONTENT_LENGTH = 5000;
const WARNING_THRESHOLD = 0.8;

export function PostComposer({
  onContentChange,
  isUpdate = false,
  onUpdateToggle,
  disabled = false,
}: PostComposerProps) {
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [localIsUpdate, setLocalIsUpdate] = useState(isUpdate);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('post_draft');
    if (draft) {
      setContent(draft);
      setCharCount(draft.length);
      onContentChange(draft);
    }
  }, [onContentChange]);

  // Auto-save draft with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim()) {
        localStorage.setItem('post_draft', content);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setCharCount(newContent.length);
      onContentChange(newContent);
    },
    [onContentChange]
  );

  const handleUpdateToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalIsUpdate(e.target.checked);
      onUpdateToggle?.(e.target.checked);
    },
    [onUpdateToggle]
  );

  const percentUsed = charCount / MAX_CONTENT_LENGTH;
  const isWarning = percentUsed >= WARNING_THRESHOLD;
  const isError = percentUsed >= 1;

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Share an update with your families..."
          disabled={disabled}
          className={`w-full min-h-[200px] p-4 rounded-lg border-2 bg-slate-900 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-0 transition-colors ${
            isError
              ? 'border-red-500'
              : isWarning
              ? 'border-yellow-500'
              : 'border-slate-700 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localIsUpdate}
              onChange={handleUpdateToggle}
              disabled={disabled}
              className="w-4 h-4 rounded border-slate-600 text-blue-600 cursor-pointer"
            />
            <span className="text-sm text-gray-300 flex items-center gap-1">
              <span className="text-lg">📢</span>
              Mark as Update
            </span>
          </label>
        </div>

        <div className={`text-sm font-medium ${
          isError
            ? 'text-red-400'
            : isWarning
            ? 'text-yellow-400'
            : 'text-gray-400'
        }`}>
          {charCount} / {MAX_CONTENT_LENGTH}
          {isError && ' (exceeds limit)'}
          {isWarning && !isError && ' (80% full)'}
        </div>
      </div>

      {isError && (
        <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
          Content exceeds {MAX_CONTENT_LENGTH} character limit
        </div>
      )}

      {isWarning && !isError && (
        <div className="text-yellow-400 text-sm bg-yellow-900/20 p-2 rounded">
          You&apos;re approaching the character limit
        </div>
      )}
    </div>
  );
}
