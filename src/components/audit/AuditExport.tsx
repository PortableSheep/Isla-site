'use client';

import { useState } from 'react';
import { AuditLogFilters } from '@/types/audit';
import { exportAuditLogs } from '@/lib/auditLog';

interface AuditExportProps {
  filters?: AuditLogFilters;
}

export function AuditExport({ filters = {} }: AuditExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const csv = await exportAuditLogs(filters);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium text-sm"
      >
        {isExporting ? 'Exporting...' : '📥 Export to CSV'}
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  );
}
