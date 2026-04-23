'use client';

import { useEffect, useState } from 'react';
import { AuditLog, AuditLogFilters } from '@/types/audit';
import { AuditLogTable, AuditFilters, AuditExport } from '@/components/audit';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const pageSize = 50;

  useEffect(() => {
    fetchLogs(0);
  }, [filters]);

  const fetchLogs = async (offset: number) => {
    try {
      setIsLoading(true);
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
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(offset / pageSize);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPage = () => {
    const newOffset = Math.max(0, currentPage - 1) * pageSize;
    fetchLogs(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = (currentPage + 1) * pageSize;
    fetchLogs(newOffset);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <AuditExport filters={filters} />
      </div>

      <AuditFilters onFiltersChange={(newFilters) => {
        setFilters(newFilters);
        setCurrentPage(0);
      }} />

      <div className="bg-white p-4 rounded-lg border">
        <div className="mb-4 text-sm text-gray-600">
          Showing {Math.min(logs.length, pageSize)} of {totalCount} entries
        </div>

        <AuditLogTable logs={logs} isLoading={isLoading} />

        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded font-medium"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {Math.ceil(totalCount / pageSize)}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
