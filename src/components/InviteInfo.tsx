'use client';

import { InviteInfo } from '@/lib/inviteFlow';

interface InviteInfoProps {
  inviteInfo: InviteInfo;
}

export function InviteInfoComponent({ inviteInfo }: InviteInfoProps) {
  const getStatusDisplay = () => {
    switch (inviteInfo.status) {
      case 'valid':
        return {
          title: '✓ Valid Invite',
          color: 'bg-green-900/20 border-green-700',
          textColor: 'text-green-200',
        };
      case 'expired':
        return {
          title: '⏰ Invite Expired',
          color: 'bg-yellow-900/20 border-yellow-700',
          textColor: 'text-yellow-200',
        };
      case 'redeemed':
        return {
          title: '✓ Already Redeemed',
          color: 'bg-blue-900/20 border-blue-700',
          textColor: 'text-blue-200',
        };
      case 'invalid':
      default:
        return {
          title: '✗ Invalid Invite',
          color: 'bg-red-900/20 border-red-700',
          textColor: 'text-red-200',
        };
    }
  };

  const status = getStatusDisplay();

  if (inviteInfo.status === 'invalid') {
    return (
      <div className={`${status.color} border rounded-lg p-6 text-center`}>
        <h2 className={`text-lg font-semibold ${status.textColor} mb-2`}>
          {status.title}
        </h2>
        <p className="text-gray-300">This invite link is not valid or does not exist.</p>
      </div>
    );
  }

  if (inviteInfo.status === 'expired') {
    return (
      <div className={`${status.color} border rounded-lg p-6 text-center`}>
        <h2 className={`text-lg font-semibold ${status.textColor} mb-2`}>
          {status.title}
        </h2>
        <p className="text-gray-300">This invite has expired and can no longer be used.</p>
      </div>
    );
  }

  if (inviteInfo.status === 'redeemed') {
    return (
      <div className={`${status.color} border rounded-lg p-6 text-center`}>
        <h2 className={`text-lg font-semibold ${status.textColor} mb-2`}>
          {status.title}
        </h2>
        <p className="text-gray-300">This invite has already been used.</p>
      </div>
    );
  }

  return (
    <div className={`${status.color} border rounded-lg p-6 text-center`}>
      <h2 className={`text-xl font-semibold ${status.textColor} mb-4`}>
        {status.title}
      </h2>
      <div className="text-3xl font-bold text-white mb-2">{inviteInfo.name}</div>
      <p className="text-gray-300 text-sm mb-4">
        Family · {inviteInfo.memberCount} {inviteInfo.memberCount === 1 ? 'member' : 'members'}
      </p>
      {inviteInfo.expiresAt && (
        <p className="text-xs text-gray-400">
          Expires: {new Date(inviteInfo.expiresAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
