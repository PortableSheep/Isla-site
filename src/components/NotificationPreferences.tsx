'use client';

import React, { useState, useEffect } from 'react';
import { NotificationPreference, NotificationPreferencesInput } from '@/types/notifications';
import { NotificationSection } from './NotificationSection';
import { FrequencySelector } from './FrequencySelector';

interface NotificationPreferencesProps {
  preferences: NotificationPreference | null;
  onSave?: (prefs: NotificationPreference) => void;
}

export function NotificationPreferences({
  preferences: initialPreferences,
  onSave,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    initialPreferences
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  if (!preferences) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading notification preferences...</p>
      </div>
    );
  }

  const handleToggle = (field: keyof NotificationPreference) => {
    if (typeof preferences[field] === 'boolean') {
      setPreferences({
        ...preferences,
        [field]: !(preferences[field] as boolean),
      });
      setSuccess(false);
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    setPreferences({
      ...preferences,
      email_frequency: frequency as 'immediate' | 'digest' | 'off',
    });
    setSuccess(false);
  };

  const handleDigestDayChange = (day: string) => {
    setPreferences({
      ...preferences,
      digest_day: day as any,
    });
    setSuccess(false);
  };

  const handleDigestTimeChange = (time: string) => {
    setPreferences({
      ...preferences,
      digest_time: time,
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_updates: preferences.email_updates,
          email_replies: preferences.email_replies,
          email_children: preferences.email_children,
          in_app_updates: preferences.in_app_updates,
          in_app_replies: preferences.in_app_replies,
          in_app_children: preferences.in_app_children,
          email_frequency: preferences.email_frequency,
          digest_day: preferences.digest_day,
          digest_time: preferences.digest_time,
        } as NotificationPreferencesInput),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      const saved = await response.json();
      setPreferences(saved);
      setSuccess(true);
      if (onSave) {
        onSave(saved);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">Preferences saved successfully!</p>
        </div>
      )}

      {/* Email Notifications */}
      <NotificationSection
        title="Email Notifications"
        description="Choose which updates you'd like to receive via email"
      >
        <Toggle
          label="Updates"
          description="Receive emails about new updates"
          checked={preferences.email_updates}
          onChange={() => handleToggle('email_updates')}
        />
        <Toggle
          label="Replies"
          description="Receive emails when someone replies to your posts"
          checked={preferences.email_replies}
          onChange={() => handleToggle('email_replies')}
        />
        <Toggle
          label="New Children"
          description="Receive emails when a new child is added to your family"
          checked={preferences.email_children}
          onChange={() => handleToggle('email_children')}
        />
      </NotificationSection>

      {/* In-App Notifications */}
      <NotificationSection
        title="In-App Notifications"
        description="Choose which updates you'd like to see in your app"
      >
        <Toggle
          label="Updates"
          description="See notifications about new updates"
          checked={preferences.in_app_updates}
          onChange={() => handleToggle('in_app_updates')}
        />
        <Toggle
          label="Replies"
          description="See notifications when someone replies to your posts"
          checked={preferences.in_app_replies}
          onChange={() => handleToggle('in_app_replies')}
        />
        <Toggle
          label="New Children"
          description="See notifications when a new child is added to your family"
          checked={preferences.in_app_children}
          onChange={() => handleToggle('in_app_children')}
        />
      </NotificationSection>

      {/* Frequency Preferences */}
      <NotificationSection
        title="Frequency Preferences"
        description="Customize how often you receive email notifications"
      >
        <FrequencySelector
          frequency={preferences.email_frequency}
          digestDay={preferences.digest_day}
          digestTime={preferences.digest_time}
          onFrequencyChange={handleFrequencyChange}
          onDigestDayChange={handleDigestDayChange}
          onDigestTimeChange={handleDigestTimeChange}
          disabled={isSaving}
        />
      </NotificationSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <span className="inline-block animate-spin mr-2">⌛</span>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked
            ? 'bg-blue-600'
            : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
