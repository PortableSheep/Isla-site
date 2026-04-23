'use client';

import React, { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  childName: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function RejectionModal({
  isOpen,
  childName,
  onConfirm,
  onCancel,
  isLoading,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason);
    setReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-2">
          Reject {childName}?
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          This action will remove {childName} from your family. You can optionally provide a reason.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: Reason for rejection..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-4"
            rows={4}
            disabled={isLoading}
          />

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
