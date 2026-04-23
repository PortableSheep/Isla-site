export interface Post {
  id: string;
  family_id: string | null;
  author_id: string;
  content: string;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  hidden: boolean;
  flagged: boolean;
  flag_count: number;
  is_update: boolean;
}

export interface PostFlag {
  id: string;
  post_id: string;
  flagged_by: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'dismissed';
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
