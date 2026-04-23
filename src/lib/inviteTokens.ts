import { supabase } from './supabase';
import { InviteToken } from '../types/invite';
import { randomBytes } from 'crypto';

const TOKEN_LENGTH = 32;
const DEFAULT_EXPIRY_DAYS = 30;

export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

export function checkExpiration(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  return currentTime > expiryTime;
}

export async function createInviteToken(
  createdBy: string,
  familyId?: string,
  expiresInDays: number = DEFAULT_EXPIRY_DAYS
): Promise<InviteToken> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('invite_tokens') as any)
    .insert([
      {
        token,
        created_by: createdBy,
        family_id: familyId || null,
        expires_at: expiresAt.toISOString(),
        redeemed_at: null,
        redeemed_by: null,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create invite token: ${error.message}`);
  }

  return data;
}

export async function getTokenInfo(token: string): Promise<InviteToken | null> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get token info: ${error.message}`);
  }

  return data;
}

export async function validateToken(token: string): Promise<{
  isValid: boolean;
  reason?: string;
  tokenData?: InviteToken;
}> {
  if (!token || token.length !== TOKEN_LENGTH * 2) {
    return { isValid: false, reason: 'Invalid token format' };
  }

  const tokenData = await getTokenInfo(token);

  if (!tokenData) {
    return { isValid: false, reason: 'Token not found' };
  }

  if (tokenData.redeemed_at) {
    return { isValid: false, reason: 'Token already redeemed', tokenData };
  }

  if (checkExpiration(tokenData.expires_at)) {
    return { isValid: false, reason: 'Token expired', tokenData };
  }

  return { isValid: true, tokenData };
}

export async function redeemToken(token: string, userId: string): Promise<InviteToken> {
  const validation = await validateToken(token);

  if (!validation.isValid) {
    throw new Error(`Cannot redeem token: ${validation.reason}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('invite_tokens') as any)
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_by: userId,
    })
    .eq('token', token)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to redeem token: ${error.message}`);
  }

  return data;
}

export async function getTokensByFamilyId(familyId: string): Promise<InviteToken[]> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get tokens by family: ${error.message}`);
  }

  return data || [];
}

export async function getTokensByCreatedBy(createdBy: string): Promise<InviteToken[]> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('created_by', createdBy)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get tokens by creator: ${error.message}`);
  }

  return data || [];
}
