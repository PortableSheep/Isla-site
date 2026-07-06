'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuditLog, AuditLogFilters } from '@/types/audit';
import { AuditLogTable, AuditFilters, AuditExport } from '@/components/audit';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const pageSize = 50;

  const fetchLogs = useCallback(async (offset: number) => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const queryParams = new URLSearchParams();

      if (filters.action) {
        const actions = Array.isArray(filters.action)
          ? filters.action.join(',')
          : filters.action;
        queryParams.append('action', actions);
      }

      if (filters.actor_id) {
        queryParams.append('actor_id', filters.actor_id);
      }

      if (filters.subject_id) {
        queryParams.append('subject_id', filters.subject_id);
      }

      if (filters.subject_type) {
        queryParams.append('subject_type', filters.subject_type);
      }

      if (filters.family_id) {
        queryParams.append('family_id', filters.family_id);
      }

      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }

      queryParams.append('limit', pageSize.toString());
      queryParams.append('offset', offset.toString());

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail = typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`;
        throw new Error(`Failed to fetch audit logs (${detail})`);
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(offset / pageSize);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs(0);
  }, [fetchLogs]);

  const handlePreviousPage = () => {
    const newOffset = Math.max(0, currentPage - 1) * pageSize;
    fetchLogs(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = (currentPage + 1) * pageSize;
    fetchLogs(newOffset);
  };

  const handleFiltersChange = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  }, []);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-100">Audit Logs</h1>
        <AuditExport filters={filters} />
      </div>

      <AuditFilters onFiltersChange={handleFiltersChange} />

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
        {fetchError ? (
          <div className="mb-3 rounded border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {fetchError}
          </div>
        ) : null}
        <div className="mb-4 text-sm text-slate-400">
          Showing {Math.min(logs.length, pageSize)} of {totalCount} entries
        </div>

        <AuditLogTable logs={logs} isLoading={isLoading} />

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="rounded border border-white/15 bg-white/5 px-4 py-2 font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-sm text-slate-400">
            Page {currentPage + 1} of {Math.ceil(totalCount / pageSize)}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="rounded border border-white/15 bg-white/5 px-4 py-2 font-medium text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
