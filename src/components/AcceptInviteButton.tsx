'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AcceptInviteButtonProps {
  token: string;
  onSuccess?: () => void;
}

export function AcceptInviteButton({ token, onSuccess }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/families/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invite');
        return;
      }

      onSuccess?.();
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred while processing your invite');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
      >
        {loading ? 'Joining Family...' : 'Accept Invite'}
      </button>
    </div>
  );
}
