'use client';

import { useEffect, useState } from 'react';
import { AuditAction, AuditSubjectType } from '@/types/audit';
import type { AuditLogFilters } from '@/types/audit';

interface AuditFiltersProps {
  onFiltersChange: (filters: AuditLogFilters) => void;
}

const ACTIONS: AuditAction[] = [
  'moderation_approve',
  'moderation_reject',
  'moderation_delete',
  'appeal_submitted',
  'appeal_approved',
  'appeal_rejected',
  'post_review_requested',
  'post_review_request_approved',
  'post_review_request_rejected',
  'post_deleted',
  'post_hidden',
  'post_flagged',
  'flag_reviewed',
  'user_suspended',
  'user_unsuspended',
  'user_auto_unsuspended',
];

const SUBJECT_TYPES: AuditSubjectType[] = [
  'post',
  'user',
  'flag',
];

export function AuditFilters({ onFiltersChange }: AuditFiltersProps) {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [subjectType, setSubjectType] = useState<AuditSubjectType | ''>('');
  const [actorId, setActorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const filters: AuditLogFilters = {};

    if (action) filters.action = action;
    if (subjectType) filters.subject_type = subjectType;
    if (actorId) filters.actor_id = actorId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    onFiltersChange(filters);
  }, [action, subjectType, actorId, startDate, endDate, onFiltersChange]);

  const handleReset = () => {
    setAction('');
    setSubjectType('');
    setActorId('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Action type</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as AuditAction)}
            className="w-full rounded border border-white/15 bg-black/20 p-2 text-sm text-slate-100"
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
          <label className="mb-1 block text-sm font-medium text-slate-300">Subject type</label>
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value as AuditSubjectType)}
            className="w-full rounded border border-white/15 bg-black/20 p-2 text-sm text-slate-100"
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
          <label className="mb-1 block text-sm font-medium text-slate-300">Actor ID</label>
          <input
            type="text"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="Filter by actor ID"
            className="w-full rounded border border-white/15 bg-black/20 p-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded border border-white/15 bg-black/20 p-2 text-sm text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded border border-white/15 bg-black/20 p-2 text-sm text-slate-100"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleReset}
            className="w-full rounded border border-white/15 bg-white/5 p-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
