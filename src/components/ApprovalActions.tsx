'use client';

import React from 'react';
import { RejectionModal } from './RejectionModal';

interface ApprovalActionsProps {
  childId: string;
  childName: string;
  familyId: string;
  onApproveSuccess: () => void;
  onRejectSuccess: () => void;
}

export function ApprovalActions({
  childId,
  childName,
  familyId,
  onApproveSuccess,
  onRejectSuccess,
}: ApprovalActionsProps) {
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/approvals/approve/${childId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve child');
      }

      onApproveSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsRejecting(true);
    setError(null);
    try {
      const response = await fetch(`/api/approvals/reject/${childId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject child');
      }

      setShowRejectModal(false);
      onRejectSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {isApproving ? 'Approving...' : 'Approve'}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isApproving || isRejecting}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {isRejecting ? 'Rejecting...' : 'Reject'}
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      <RejectionModal
        isOpen={showRejectModal}
        childName={childName}
        onConfirm={handleReject}
        onCancel={() => setShowRejectModal(false)}
        isLoading={isRejecting}
      />
    </>
  );
}
