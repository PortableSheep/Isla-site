// @ts-nocheck
import { supabase } from './supabase';
import { 
  AuditLogInput, 
  AuditLogFilters, 
  AuditLogResponse, 
  AuditLog,
  AuditAction,
  AuditSubjectType,
  ActorRole
} from '@/types/audit';

/**
 * Log an action for audit trail
 * Runs asynchronously to avoid blocking main operations
 */
export async function logAction(
  action: AuditAction,
  actorId: string,
  subjectType: AuditSubjectType,
  subjectId: string,
  reason?: string,
  metadata?: Record<string, any>,
  familyId?: string,
  actorRole: ActorRole = 'admin'
): Promise<void> {
  try {
    // Run in background without awaiting
    (supabase as any)
      .from('audit_logs')
      .insert({
        action,
        actor_id: actorId,
        actor_role: actorRole,
        subject_type: subjectType,
        subject_id: subjectId,
        reason,
        metadata,
        family_id: familyId,
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to log audit action:', error);
        }
      });
  } catch (error) {
    console.error('Error in logAction:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {},
  adminCheck = true
): Promise<AuditLogResponse> {
  try {
    const {
      action,
      actor_id,
      subject_id,
      subject_type,
      family_id,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = filters;

    let query = (supabase as any)
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (action) {
      if (Array.isArray(action)) {
        query = query.in('action', action);
      } else {
        query = query.eq('action', action);
      }
    }

    if (actor_id) {
      query = query.eq('actor_id', actor_id);
    }

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    if (subject_type) {
      query = query.eq('subject_type', subject_type);
    }

    if (family_id) {
      query = query.eq('family_id', family_id);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      logs: (data || []) as AuditLog[],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

/**
 * Get all actions on a specific post
 */
export async function getPostAuditTrail(postId: string): Promise<AuditLog[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('audit_logs')
      .select('*')
      .eq('subject_id', postId)
      .eq('subject_type', 'post')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch post audit trail: ${error.message}`);
    }

    return (data || []) as AuditLog[];
  } catch (error) {
    console.error('Error fetching post audit trail:', error);
    throw error;
  }
}

/**
 * Get all actions by a specific user
 */
export async function getUserActivity(userId: string): Promise<AuditLog[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('audit_logs')
      .select('*')
      .eq('actor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }

    return (data || []) as AuditLog[];
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
}

/**
 * Export audit logs to CSV format
 */
export async function exportAuditLogs(
  filters: AuditLogFilters = {}
): Promise<string> {
  try {
    const { logs } = await getAuditLogs({ ...filters, limit: 10000 });

    const headers = [
      'Timestamp',
      'Action',
      'Actor ID',
      'Actor Role',
      'Subject Type',
      'Subject ID',
      'Reason',
      'Metadata',
    ];

    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.action,
      log.actor_id,
      log.actor_role,
      log.subject_type,
      log.subject_id,
      log.reason || '',
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(familyId?: string): Promise<Record<string, number>> {
  try {
    let query = (supabase as any)
      .from('audit_logs')
      .select('action', { count: 'exact', head: true });

    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    // Fetch counts for each action type
    const actions: AuditAction[] = [
      'post_deleted',
      'post_hidden',
      'user_suspended',
      'post_flagged',
      'flag_reviewed',
    ];

    const stats: Record<string, number> = {};

    for (const action of actions) {
      let actionQuery = (supabase as any)
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', action);

      if (familyId) {
        actionQuery = actionQuery.eq('family_id', familyId);
      }

      const { count } = await actionQuery;
      stats[action] = count || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    throw error;
  }
}
