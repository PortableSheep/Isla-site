'use client';

import { ApprovalDashboard } from '@/components/ApprovalDashboard';
import { CreatureDisplay } from '@/components/CreatureDisplay';

export default function ApprovalsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-950 dark:via-blue-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Guardian creature */}
        <div className="mb-12 flex items-start gap-6">
          <div className="hidden sm:block">
            <CreatureDisplay
              creatureId="guardian"
              state="protective"
              animation="protective_stance"
              size="medium"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Child Approvals
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve pending child profiles to allow them access to the family wall.
              As a guardian, you&apos;re responsible for keeping your family safe.
            </p>
          </div>
        </div>

        {/* Main dashboard component */}
        <ApprovalDashboard />
      </div>
    </div>
  );
}
