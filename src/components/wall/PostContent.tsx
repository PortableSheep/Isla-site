'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useState } from 'react';

interface PostContentProps {
  content: string;
  maxLength?: number;
}

export function PostContent({ content, maxLength = 500 }: PostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sanitize content to prevent XSS
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  const isTruncated = sanitized.length > maxLength;
  const displayContent = isExpanded ? sanitized : sanitized.slice(0, maxLength);

  // Convert line breaks to visual breaks
  const lines = displayContent.split('\n');

  return (
    <div className="text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
      {lines.map((line, idx) => (
        <div key={idx} className="mb-1 last:mb-0">
          {line || '\u00a0'}
        </div>
      ))}

      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
