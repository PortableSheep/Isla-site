export type AuditAction = 
  | 'moderation_approve'
  | 'moderation_reject'
  | 'moderation_delete'
  | 'appeal_submitted'
  | 'appeal_approved'
  | 'appeal_rejected'
  | 'post_review_requested'
  | 'post_review_request_approved'
  | 'post_review_request_rejected'
  | 'post_deleted'
  | 'post_hidden'
  | 'post_unhidden'
  | 'post_flagged'
  | 'flag_reviewed'
  | 'flag_dismissed'
  | 'profile_created'
  | 'child_approved'
  | 'child_rejected'
  | 'appeal_reviewed'
  | 'user_suspended'
  | 'user_unsuspended'
  | 'user_auto_unsuspended';

export type AuditSubjectType = 'post' | 'user' | 'flag' | 'profile' | 'appeal';

export type ActorRole = 'admin' | 'parent' | 'child' | 'system';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor_id: string;
  actor_role: ActorRole;
  subject_type: AuditSubjectType;
  subject_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  family_id?: string;
}

export interface AuditLogInput {
  action: AuditAction;
  actor_id: string;
  actor_role: ActorRole;
  subject_type: AuditSubjectType;
  subject_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  family_id?: string;
}

export interface AuditLogFilters {
  action?: AuditAction | AuditAction[];
  actor_id?: string;
  subject_id?: string;
  subject_type?: AuditSubjectType;
  family_id?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}
