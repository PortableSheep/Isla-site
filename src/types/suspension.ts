export type AppealStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type SuspensionReason = 'spam' | 'harassment' | 'multiple_violations' | 'other';

export interface SuspensionData {
  suspended: boolean;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: SuspensionReason | null;
  suspension_reason_text: string | null;
  suspension_duration_days: number | null;
  suspension_expires_at: string | null;
  appeal_status: AppealStatus;
  appeal_submitted_at: string | null;
}

export interface SuspensionAppeal {
  id: string;
  user_id: string;
  appeal_text: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuspensionRequestPayload {
  reason: SuspensionReason;
  reason_text?: string;
  duration_days?: number | null; // null for permanent
}
