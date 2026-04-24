'use client';

import { useState, useEffect } from 'react';
import { NotificationPreference } from '@/types/notifications';
import { NotificationPreferences } from '@/components/NotificationPreferences';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/users/notifications');

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch preferences');
        }

        const data = await response.json();
        setPreferences(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load preferences';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen iz-grid-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold iz-gradient-text mb-2">
            Settings
          </h1>
          <p className="text-slate-400">
            Manage your notification preferences and account.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 iz-card p-4 border border-rose-500/40 text-rose-200"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="iz-card p-8 text-center text-slate-400">
            Loading preferences…
          </div>
        ) : (
          <>
            <section className="iz-card p-6 sm:p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Notification Settings
              </h2>

              <NotificationPreferences
                preferences={preferences}
                onSave={handleSave}
              />
            </section>

            {saved && (
              <div
                className="mt-4 iz-card p-4 border border-emerald-500/40 text-emerald-200"
                role="status"
              >
                Settings saved.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
