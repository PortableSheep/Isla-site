'use client';

import { useState } from 'react';
import { SuspensionAppeal } from '@/types/suspension';

interface AppealFormProps {
  onSubmitSuccess?: () => void;
  previousAppeal?: SuspensionAppeal | null;
}

export function AppealForm({ onSubmitSuccess, previousAppeal }: AppealFormProps) {
  const [appealText, setAppealText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const charCount = appealText.length;
  const maxChars = 2000;
  const charPercentage = (charCount / maxChars) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!appealText.trim()) {
      setError('Please enter your appeal');
      return;
    }

    if (appealText.length > maxChars) {
      setError(`Appeal cannot exceed ${maxChars} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appeal_text: appealText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setSuccess(true);
      setAppealText('');

      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (previousAppeal && previousAppeal.status === 'pending') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">
          Appeal Pending Review
        </h3>
        <p className="text-yellow-800 mb-4">
          You already have a pending appeal submitted on{' '}
          {new Date(previousAppeal.created_at).toLocaleDateString()}. A moderator
          will review your appeal shortly.
        </p>
        <p className="text-sm text-yellow-700">
          Your appeal: &quot;{previousAppeal.appeal_text}&quot;
        </p>
      </div>
    );
  }

  if (previousAppeal && previousAppeal.status === 'rejected') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Appeal Previously Rejected
        </h3>
        <p className="text-red-800 mb-4">
          Your previous appeal was rejected on{' '}
          {new Date(previousAppeal.reviewed_at || '').toLocaleDateString()}.
        </p>
        {previousAppeal.review_response && (
          <div className="bg-white border border-red-200 rounded p-3 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Rejection Reason:
            </p>
            <p className="text-sm text-gray-600">{previousAppeal.review_response}</p>
          </div>
        )}
        <p className="text-sm text-red-700">
          You can submit a new appeal if you have additional information.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit an Appeal</h2>
      <p className="text-gray-600 mb-6">
        If you believe your suspension was made in error, please explain your
        situation. A moderator will review your appeal and respond within 7 business
        days.
      </p>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-semibold">
            ✓ Your appeal has been submitted successfully
          </p>
          <p className="text-green-700 text-sm mt-1">
            You will be notified when a moderator reviews your appeal.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="appeal" className="block text-sm font-semibold text-gray-700 mb-2">
            Your Appeal (Required)
          </label>
          <textarea
            id="appeal"
            value={appealText}
            onChange={(e) => setAppealText(e.target.value)}
            disabled={success || isSubmitting}
            placeholder="Please explain why you believe your account should be unsuspended..."
            maxLength={maxChars}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={6}
          />

          <div className="mt-2 flex justify-between items-center">
            <div className="flex-1 mr-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-colors ${
                    charPercentage > 90
                      ? 'bg-red-500'
                      : charPercentage > 75
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
            </div>
            <span
              className={`text-sm font-medium ${
                charPercentage > 90
                  ? 'text-red-600'
                  : charPercentage > 75
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}
            >
              {charCount} / {maxChars}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || success || charCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {isSubmitting ? 'Submitting...' : success ? 'Appeal Submitted' : 'Submit Appeal'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-4">
        Please be honest and provide as much detail as possible. Appeals are reviewed
        by human moderators and taken seriously.
      </p>
    </div>
  );
}
