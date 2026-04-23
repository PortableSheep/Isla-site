import { supabase } from './supabase';
import { SuspensionData } from '@/types/suspension';

export async function getUserSuspensionStatus(
  userId: string
): Promise<SuspensionData | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        'suspended, suspended_at, suspended_by, suspension_reason, suspension_reason_text, suspension_duration_days, suspension_expires_at, appeal_status, appeal_submitted_at'
      )
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching suspension status:', error);
      return null;
    }

    return data as unknown as SuspensionData;
  } catch (err) {
    console.error('Error in getUserSuspensionStatus:', err);
    return null;
  }
}

export async function checkAndAutoUnsuspend(userId: string): Promise<boolean> {
  try {
    const suspension = await getUserSuspensionStatus(userId);

    if (
      !suspension?.suspended ||
      !suspension.suspension_expires_at ||
      new Date(suspension.suspension_expires_at) > new Date()
    ) {
      return false;
    }

    // Auto-unsuspend the user
    const { error } = await (supabase as any)
      .from('user_profiles')
      .update({
        suspended: false,
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        suspension_reason_text: null,
        suspension_duration_days: null,
        suspension_expires_at: null,
        appeal_status: 'none',
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error auto-unsuspending user:', error);
      return false;
    }

    // Log the action
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any)
        .from('audit_logs')
        .insert({
          action: 'user_auto_unsuspended',
          actor_id: user.id,
          reason: 'Suspension duration expired',
        });
    }

    return true;
  } catch (err) {
    console.error('Error in checkAndAutoUnsuspend:', err);
    return false;
  }
}

export function getFormattedSuspensionReason(reason: string | null): string {
  if (!reason) return 'Unknown';

  return reason
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function calculateSuspensionExpiry(
  durationDays: number | null
): Date | null {
  if (!durationDays) return null;

  const now = new Date();
  return new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
}
