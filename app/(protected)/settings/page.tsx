'use client';

import { useState, useEffect } from 'react';
import { NotificationPreference } from '@/types/notifications';
import { NotificationPreferences } from '@/components/NotificationPreferences';

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users/notifications');

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load preferences';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage how you receive notifications from Isla.site
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading preferences...</p>
        </div>
      ) : (
        <NotificationPreferences
          preferences={preferences}
          onSave={setPreferences}
        />
      )}
    </div>
  );
}
