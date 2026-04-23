export type FlagStatus = 'pending' | 'reviewed' | 'dismissed';

export interface ModFlag {
  id: string;
  post_id: string;
  flagged_by: string;
  reason: string;
  created_at: string;
  status: FlagStatus;
}

export interface FlaggedPostData {
  id: string;
  family_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  hidden: boolean;
  flagged: boolean;
  flag_count: number;
  flags: ModFlag[];
}

export interface ModerationStats {
  total_flags: number;
  pending_flags: number;
  reviewed_flags: number;
  dismissed_flags: number;
}
