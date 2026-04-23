import { AuditLog } from '@/types/audit';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const actionLabelMap: Record<string, string> = {
  post_deleted: '🗑️ Post Deleted',
  post_hidden: '👁️ Post Hidden',
  post_unhidden: '👁️ Post Unhidden',
  user_suspended: '⛔ User Suspended',
  user_unsuspended: '✅ User Unsuspended',
  post_flagged: '🚩 Post Flagged',
  flag_reviewed: '📋 Flag Reviewed',
  flag_dismissed: '✋ Flag Dismissed',
  profile_created: '👤 Profile Created',
  child_approved: '✅ Child Approved',
  child_rejected: '❌ Child Rejected',
  appeal_reviewed: '📝 Appeal Reviewed',
};

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-2 text-left">Timestamp</th>
            <th className="px-4 py-2 text-left">Action</th>
            <th className="px-4 py-2 text-left">Actor</th>
            <th className="px-4 py-2 text-left">Subject</th>
            <th className="px-4 py-2 text-left">Reason</th>
            <th className="px-4 py-2 text-left">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 text-xs text-gray-600">
                <div className="text-xs text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {actionLabelMap[log.action] || log.action}
              </td>
              <td className="px-4 py-2 text-xs font-mono">
                {log.actor_id.substring(0, 8)}...
                <div className="text-xs text-gray-500">{log.actor_role}</div>
              </td>
              <td className="px-4 py-2 text-xs">
                <div className="font-mono">{log.subject_id.substring(0, 8)}...</div>
                <div className="text-gray-500">{log.subject_type}</div>
              </td>
              <td className="px-4 py-2 text-xs max-w-xs truncate">
                {log.reason || '-'}
              </td>
              <td className="px-4 py-2 text-xs">
                {log.metadata && (
                  <details>
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      View
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
