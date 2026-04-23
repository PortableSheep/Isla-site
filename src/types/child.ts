export type ChildStatus = 'pending_approval' | 'active' | 'rejected' | 'suspended';

export interface ChildProfile {
  id: string;
  parent_id: string;
  family_id: string | null;
  name: string;
  email: string | null;
  age: number | null;
  bio: string | null;
  status: ChildStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChildProfileRequest {
  name: string;
  age?: number;
  bio?: string;
}

export interface UpdateChildProfileRequest {
  name?: string;
  age?: number;
  bio?: string;
}

export interface ChildProfileResponse extends ChildProfile {
  created_date?: string;
  is_approved?: boolean;
  is_pending?: boolean;
}
