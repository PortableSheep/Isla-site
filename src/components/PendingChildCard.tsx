'use client';

import React from 'react';
import { ApprovalActions } from './ApprovalActions';

interface PendingChildCardProps {
  childId: string;
  childEmail: string;
  familyId: string;
  familyName: string;
  createdAt: string;
  onActionComplete: () => void;
}

export function PendingChildCard({
  childId,
  childEmail,
  familyId,
  familyName,
  createdAt,
  onActionComplete,
}: PendingChildCardProps) {
  const createdDate = new Date(createdAt);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{childEmail}</h3>
        <p className="text-gray-400 text-sm">{familyName}</p>
      </div>

      <div className="mb-4 text-xs text-gray-500">
        Requested on {formattedDate}
      </div>

      <ApprovalActions
        childId={childId}
        childName={childEmail}
        familyId={familyId}
        onApproveSuccess={onActionComplete}
        onRejectSuccess={onActionComplete}
      />
    </div>
  );
}
