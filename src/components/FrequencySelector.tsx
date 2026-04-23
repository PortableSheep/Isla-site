'use client';

import React from 'react';
import { NotificationFrequency, DigestDay } from '@/types/notifications';

interface FrequencySelectorProps {
  frequency: NotificationFrequency;
  digestDay: DigestDay;
  digestTime: string;
  onFrequencyChange: (frequency: NotificationFrequency) => void;
  onDigestDayChange: (day: DigestDay) => void;
  onDigestTimeChange: (time: string) => void;
  disabled?: boolean;
}

const DIGEST_DAYS: DigestDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function FrequencySelector({
  frequency,
  digestDay,
  digestTime,
  onFrequencyChange,
  onDigestDayChange,
  onDigestTimeChange,
  disabled = false,
}: FrequencySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Email Frequency
        </label>
        <div className="space-y-2">
          {(['immediate', 'digest', 'off'] as const).map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name="frequency"
                value={option}
                checked={frequency === option}
                onChange={(e) =>
                  onFrequencyChange(e.target.value as NotificationFrequency)
                }
                disabled={disabled}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="ml-3 text-sm text-gray-700 capitalize">
                {option === 'off'
                  ? 'Turn off email notifications'
                  : `Send ${option}`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {frequency === 'digest' && (
        <div className="pl-6 pt-2 border-l-2 border-blue-200 space-y-3">
          <div>
            <label htmlFor="digest-day" className="block text-sm font-medium text-gray-700">
              Digest Day
            </label>
            <select
              id="digest-day"
              value={digestDay}
              onChange={(e) => onDigestDayChange(e.target.value as DigestDay)}
              disabled={disabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            >
              {DIGEST_DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="digest-time" className="block text-sm font-medium text-gray-700">
              Digest Time
            </label>
            <input
              type="time"
              id="digest-time"
              value={digestTime}
              onChange={(e) => onDigestTimeChange(e.target.value)}
              disabled={disabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>
      )}
    </div>
  );
}
