'use client';

import { useAuth } from '@/lib/AuthContext';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import Link from 'next/link';
import styles from '@/styles/hand-drawn.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.name?.split(' ')[0] || 'Friend';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Glimmer greeting header */}
        <div className="mb-12 flex items-start gap-6">
          <div className="hidden sm:block">
            <CreatureDisplay
              creatureId="glimmer"
              state="happy"
              animation="bounce"
              size="medium"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {firstName}, welcome back!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You have {0} pending approvals and {1} new updates
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Link
            href="/compose"
            className={`${styles.creatureButton} w-full justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg`}
          >
            <span>✨</span>
            <span>Create Post</span>
          </Link>
          <Link
            href="/updates"
            className={`${styles.creatureButton} w-full justify-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg`}
          >
            <span>📰</span>
            <span>View Updates</span>
          </Link>
          <Link
            href="/notifications"
            className={`${styles.creatureButton} w-full justify-center bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-lg`}
          >
            <span>🔔</span>
            <span>Notifications</span>
          </Link>
        </div>

        {/* Family cards section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
            Your Families
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sample family card - would be rendered from data */}
            <div
              className={`${styles.creatureCard} bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-700 p-6 relative overflow-hidden`}
            >
              {/* Creature corner decoration */}
              <div className={`${styles.decorationTL}`}>👨</div>
              <div className={`${styles.decorationBR}`}>👧</div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Smith Family
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                3 members • Active
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span>📝</span>
                  <span>12 posts this month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span>💬</span>
                  <span>28 interactions</span>
                </div>
              </div>

              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                View Wall
              </button>
            </div>
          </div>

          {/* Empty state */}
          <div className={`${styles.emptyStateContainer} mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30`}>
            <div className={styles.emptyStateCreature}>🏡</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No families yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a family or wait for an invitation to join one.
            </p>
            <Link
              href="/create-family"
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Create Family
            </Link>
          </div>
        </div>

        {/* Recent activity section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Recent Activity
          </h2>

          <div className="space-y-3">
            <ActivityItem
              timestamp="2 hours ago"
              event="Sarah shared a photo"
              family="Smith Family"
            />
            <ActivityItem
              timestamp="Yesterday"
              event="New member approved: Emma"
              family="Smith Family"
            />
            <ActivityItem
              timestamp="3 days ago"
              event="Mike added a memory"
              family="Smith Family"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({
  timestamp,
  event,
  family,
}: {
  timestamp: string;
  event: string;
  family: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="text-2xl mt-1">✨</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">{event}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {family} • {timestamp}
        </p>
      </div>
    </div>
  );
}
