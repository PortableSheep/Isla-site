'use client';

import { useState, useEffect } from 'react';
import { NotificationPreference } from '@/types/notifications';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { CreatureDisplay } from '@/components/CreatureDisplay';
import styles from '@/styles/hand-drawn.module.css';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white dark:from-gray-950 dark:via-teal-950 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with Glimmer */}
        <div className="mb-12 flex items-start gap-4">
          <div className="hidden sm:block">
            <CreatureDisplay
              creatureId="glimmer"
              state="thinking"
              animation="head_tilt"
              size="medium"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Customize Your Experience
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your preferences and settings
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={`${styles.errorMessageContainer} mb-6`}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <CreatureDisplay
                creatureId="drift"
                state="floating"
                animation="dreamy_float"
                size="medium"
              />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading preferences...</p>
          </div>
        ) : (
          <>
            {/* Notification Preferences Section */}
            <div
              className={`${styles.handDrawnBorder} bg-white dark:bg-gray-900 p-8 mb-8 relative`}
              style={{
                borderColor: '#06B6D4',
                '--creature-color': '#06B6D4',
              } as React.CSSProperties}
            >
              {/* Creature header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="hidden sm:block">
                  <CreatureDisplay
                    creatureId="zing"
                    state="alert"
                    size="small"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Notification Settings
                </h2>
              </div>

              <NotificationPreferences
                preferences={preferences}
                onSave={handleSave}
              />
            </div>

            {/* General Settings Section */}
            <div
              className={`${styles.handDrawnBorder} bg-white dark:bg-gray-900 p-8 mb-8 relative`}
              style={{
                borderColor: '#10B981',
                '--creature-color': '#10B981',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="hidden sm:block">
                  <CreatureDisplay
                    creatureId="wave"
                    state="smiling"
                    size="small"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  General Settings
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Protect your eyes in low light
                    </p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Animations</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show playful creature animations
                    </p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sound Effects</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Play notification sounds
                    </p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 rounded" />
                </div>
              </div>
            </div>

            {/* Save button with success message */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className={`${styles.creatureButton} bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold`}
              >
                <span>💾</span>
                <span>Save Settings</span>
              </button>
            </div>

            {/* Success message with celebrating creature */}
            {saved && (
              <div
                className={`${styles.celebrationAnimation} mt-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800`}
              >
                <div>
                  <CreatureDisplay
                    creatureId="cheery"
                    state="celebrating"
                    animation="celebrate"
                    size="small"
                  />
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Settings saved successfully!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
