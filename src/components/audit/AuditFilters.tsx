'use client';

import { useState } from 'react';
import { AuditAction, AuditSubjectType } from '@/types/audit';

interface AuditFiltersProps {
  onFiltersChange: (filters: any) => void;
}

const ACTIONS: AuditAction[] = [
  'post_deleted',
  'post_hidden',
  'post_unhidden',
  'user_suspended',
  'user_unsuspended',
  'post_flagged',
  'flag_reviewed',
  'flag_dismissed',
  'profile_created',
  'child_approved',
  'child_rejected',
  'appeal_reviewed',
];

const SUBJECT_TYPES: AuditSubjectType[] = [
  'post',
  'user',
  'flag',
  'profile',
  'appeal',
];

export function AuditFilters({ onFiltersChange }: AuditFiltersProps) {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [subjectType, setSubjectType] = useState<AuditSubjectType | ''>('');
  const [actorId, setActorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFilterChange = () => {
    const filters: any = {};

    if (action) filters.action = action;
    if (subjectType) filters.subject_type = subjectType;
    if (actorId) filters.actor_id = actorId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    onFiltersChange(filters);
  };

  const handleReset = () => {
    setAction('');
    setSubjectType('');
    setActorId('');
    setStartDate('');
    setEndDate('');
    onFiltersChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <h3 className="font-semibold text-lg">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Action Type</label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as AuditAction);
              handleFilterChange();
            }}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">All Actions</option>
            {ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subject Type</label>
          <select
            value={subjectType}
            onChange={(e) => {
              setSubjectType(e.target.value as AuditSubjectType);
              handleFilterChange();
            }}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">All Types</option>
            {SUBJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Actor ID</label>
          <input
            type="text"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            onBlur={handleFilterChange}
            placeholder="Filter by actor ID"
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              handleFilterChange();
            }}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              handleFilterChange();
            }}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleReset}
            className="w-full p-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
