'use client';

import React from 'react';

interface NotificationSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function NotificationSection({
  title,
  description,
  children,
}: NotificationSectionProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
