'use client';

import { ApprovalDashboard } from '@/components/ApprovalDashboard';

export default function ApprovalsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Child Approvals</h1>
        <p className="text-gray-400">
          Review and approve pending child profiles to allow them access to the family wall.
        </p>
      </div>

      <ApprovalDashboard />
    </div>
  );
}
