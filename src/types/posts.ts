export interface Post {
  id: string;
  family_id: string | null;
  author_id: string;
  content: string;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason?: string | null;
  deleted_reason_text?: string | null;
  deleted_by?: string | null;
  hidden: boolean;
  hidden_reason?: string | null;
  hidden_reason_text?: string | null;
  hidden_by?: string | null;
  hidden_at?: string | null;
  flagged: boolean;
  flag_count: number;
  is_update: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejected_reason?: string | null;
}

export interface PostFlag {
  id: string;
  post_id: string;
  flagged_by: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export interface AuditLog {
  id: string;
  action: 'delete' | 'hide' | 'unhide' | 'report' | 'permanent_delete';
  actor_id: string;
  post_id?: string | null;
  reason?: string | null;
  created_at: string;
}

export interface PostCreateInput {
  family_id: string | null;
  author_id: string;
  content: string;
  parent_post_id?: string | null;
  is_update?: boolean;
}

export interface PostUpdateInput {
  content: string;
}

export interface PostWithReplies extends Post {
  replies?: Post[];
}
