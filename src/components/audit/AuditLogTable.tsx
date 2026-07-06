import { AuditLog } from '@/types/audit';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const actionLabelMap: Record<string, string> = {
  moderation_approve: '✅ Moderation Approved',
  moderation_reject: '❌ Moderation Rejected',
  moderation_delete: '🗑️ Moderation Deleted',
  appeal_submitted: '📨 Appeal Submitted',
  appeal_approved: '✅ Appeal Approved',
  appeal_rejected: '❌ Appeal Rejected',
  post_review_requested: '📝 Post Review Requested',
  post_review_request_approved: '✅ Post Review Approved',
  post_review_request_rejected: '❌ Post Review Rejected',
  post_deleted: '🗑️ Post Deleted',
  post_hidden: '👁️ Post Hidden',
  user_suspended: '⛔ User Suspended',
  user_unsuspended: '✅ User Unsuspended',
  user_auto_unsuspended: '⏲️ Auto Unsuspended',
  post_flagged: '🚩 Post Flagged',
  flag_reviewed: '📋 Flag Reviewed',
};

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-fuchsia-400"
            aria-hidden="true"
          />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-slate-200">
        <thead className="border-b border-white/10 bg-white/5 text-slate-300">
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
            <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-4 py-2 text-xs text-slate-300">
                <div className="text-xs text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {actionLabelMap[log.action] || log.action}
              </td>
              <td className="px-4 py-2 text-xs font-mono">
                {log.actor_id.substring(0, 8)}...
                <div className="text-xs text-slate-500">{log.actor_role}</div>
              </td>
              <td className="px-4 py-2 text-xs">
                <div className="font-mono">{log.subject_id.substring(0, 8)}...</div>
                <div className="text-slate-500">{log.subject_type}</div>
              </td>
              <td className="px-4 py-2 text-xs max-w-xs truncate">
                {log.reason || '-'}
              </td>
              <td className="px-4 py-2 text-xs">
                {log.metadata && (
                  <details>
                    <summary className="cursor-pointer text-sky-300 hover:underline">
                      View
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto rounded border border-white/10 bg-black/30 p-2 text-xs text-slate-200">
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
