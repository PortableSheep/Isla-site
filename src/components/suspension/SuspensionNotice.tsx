'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SuspensionData } from '@/types/suspension';

interface SuspensionNoticeProps {
  suspension: SuspensionData;
}

export function SuspensionNotice({ suspension }: SuspensionNoticeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const suspendedDate = formatDate(suspension.suspended_at);
  const expiresDate = formatDate(suspension.suspension_expires_at);

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border-2 border-red-500">
        <div className="text-center">
          <div className="inline-block bg-red-100 p-4 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M13.477 14.89A6 6 0 0 1 5.11 6.524a6 6 0 0 1 8.367 8.366L13.477 14.89zm1.414-1.414L11.07 9.975l3.828-3.828a1 1 0 0 0-1.414-1.414L9.657 8.56 5.829 4.732a1 1 0 1 0-1.414 1.414l3.828 3.828-.586.586a1 1 0 1 0 1.414 1.414l.586-.586 3.828 3.828a1 1 0 0 0 1.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-red-600 mb-2">
            Account Suspended
          </h1>

          <p className="text-gray-700 mb-6">
            Your account has been suspended and is temporarily inactive.
          </p>

          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Reason:</span>{' '}
              {(suspension.suspension_reason
                ?.replace(/_/g, ' ')
                .charAt(0)
                .toUpperCase() ?? '') +
                (suspension.suspension_reason
                  ?.replace(/_/g, ' ')
                  .slice(1) ?? '')}
            </p>

            {suspension.suspension_reason_text && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Details:</span>{' '}
                {suspension.suspension_reason_text}
              </p>
            )}

            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Suspended:</span> {suspendedDate}
            </p>

            {suspension.suspension_expires_at ? (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Expires:</span> {expiresDate}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Duration:</span> Permanent
              </p>
            )}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm mb-6 underline"
          >
            {showDetails ? 'Hide Details' : 'View Full Details'}
          </button>

          {showDetails && (
            <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-700 mb-2">What happens now?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• You cannot post or comment</li>
                <li>• You cannot view the family wall</li>
                <li>• You cannot modify your profile</li>
                <li>• You can submit an appeal below</li>
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/appeal" className="block">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200">
                Submit Appeal
              </button>
            </Link>

            <button
              onClick={() => {
                // Handle logout
                window.location.href = '/auth/logout';
              }}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded transition duration-200"
            >
              Log Out
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you believe this suspension was made in error, please submit an appeal.
            Your appeal will be reviewed by a moderator.
          </p>
        </div>
      </div>
    </div>
  );
}
