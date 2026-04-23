export interface InviteToken {
  id: string;
  token: string;
  created_by: string;
  family_id: string | null;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
  created_at: string;
}

export type InviteTokenStatus = 'valid' | 'expired' | 'redeemed' | 'not_found' | 'invalid';

export interface InviteTokenResponse {
  status: InviteTokenStatus;
  token?: InviteToken;
  message?: string;
}

export interface CreateInviteTokenRequest {
  family_id?: string;
  expires_in_days?: number;
}

export interface RedeemTokenRequest {
  token: string;
  user_id: string;
}

export interface GenerateTokenResponse {
  token: string;
  expires_at: string;
}
