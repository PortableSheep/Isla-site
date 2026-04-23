'use client';

import { useAuth } from '@/lib/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome to Your Dashboard</h1>
        <p className="text-gray-400">
          Hello, <strong>{user?.email}</strong>! 👋
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <div className="text-2xl">👤</div>
          </div>
          <p className="text-gray-400 text-sm mb-4">Manage your account settings</p>
          <a
            href="/profile"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View Profile →
          </a>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
            <div className="text-2xl">💬</div>
          </div>
          <p className="text-gray-400 text-sm mb-4">Create and manage messages</p>
          <a
            href="/messages"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View Messages →
          </a>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <div className="text-2xl">⚙️</div>
          </div>
          <p className="text-gray-400 text-sm mb-4">Update your preferences</p>
          <a
            href="/settings"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Go to Settings →
          </a>
        </div>
      </div>

      <div className="mt-12 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Getting Started</h2>
        <p className="text-gray-300">
          Welcome to Isla.site! Your account is all set up. Start creating messages and connecting with loved ones.
        </p>
      </div>
    </div>
  );
}
