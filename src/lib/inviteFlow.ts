// @ts-nocheck
import { supabase } from './supabase';

export interface FamilyInfo {
  id: string;
  name: string;
  memberCount: number;
}

export interface InviteInfo extends FamilyInfo {
  status: 'valid' | 'expired' | 'redeemed' | 'invalid';
  expiresAt?: string;
  redeemedAt?: string;
}

// Generate a secure token
export function generateInviteToken(): string {
  // Generate a 32-byte random token (64 hex characters)
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    // Client-side
    crypto.getRandomValues(array);
  } else {
    // Server-side
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(32).toString('hex');
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get family information from an invite token
export async function getInviteInfo(token: string): Promise<InviteInfo> {
  try {
    // Query the invite token
    const { data: invite, error: inviteError } = await (supabase
      .from('invite_tokens')
      .select('*, families(id, name)')
      .eq('token', token)
      .single() as any);

    if (inviteError || !invite) {
      return {
        id: '',
        name: '',
        memberCount: 0,
        status: 'invalid',
      };
    }

    // Check if already redeemed
    if ((invite as any).redeemed_at) {
      return {
        id: (invite as any).families.id,
        name: (invite as any).families.name,
        memberCount: 0,
        status: 'redeemed',
        redeemedAt: (invite as any).redeemed_at,
      };
    }

    // Check if expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return {
        id: invite.families.id,
        name: invite.families.name,
        memberCount: 0,
        status: 'expired',
        expiresAt: invite.expires_at,
      };
    }

    // Get member count
    const { count: memberCount, error: countError } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', invite.families.id);

    return {
      id: invite.families.id,
      name: invite.families.name,
      memberCount: countError ? 0 : (memberCount || 0),
      status: 'valid',
      expiresAt: invite.expires_at,
    };
  } catch (error) {
    console.error('Error getting invite info:', error);
    return {
      id: '',
      name: '',
      memberCount: 0,
      status: 'invalid',
    };
  }
}

// Accept an invite and join the family
export async function acceptInvite(token: string, userId: string): Promise<{
  success: boolean;
  familyId?: string;
  error?: string;
}> {
  try {
    // Start a transaction - get invite details
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return {
        success: false,
        error: 'Invalid invite token',
      };
    }

    // Check if already redeemed
    if (invite.redeemed_at) {
      return {
        success: false,
        error: 'Invite has already been redeemed',
      };
    }

    // Check if expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return {
        success: false,
        error: 'Invite has expired',
      };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', invite.family_id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return {
        success: false,
        error: 'You are already a member of this family',
      };
    }

    // Add user to family
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: invite.family_id,
        user_id: userId,
        role: 'parent',
      });

    if (memberError) {
      return {
        success: false,
        error: memberError.message,
      };
    }

    // Mark token as redeemed
    const { error: updateError } = await supabase
      .from('invite_tokens')
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_by: userId,
      })
      .eq('id', invite.id);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      familyId: invite.family_id,
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return {
      success: false,
      error: 'An error occurred while processing the invite',
    };
  }
}

// Get user's families
export async function getMyFamilies(userId: string): Promise<FamilyInfo[]> {
  try {
    const { data: families, error } = await supabase
      .from('family_members')
      .select('families(id, name)')
      .eq('user_id', userId);

    if (error || !families) {
      return [];
    }

    // Get member counts
    const familiesWithCounts = await Promise.all(
      families.map(async (fm: any) => {
        const { count } = await supabase
          .from('family_members')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', fm.families.id);

        return {
          id: fm.families.id,
          name: fm.families.name,
          memberCount: count || 0,
        };
      })
    );

    return familiesWithCounts;
  } catch (error) {
    console.error('Error getting user families:', error);
    return [];
  }
}
