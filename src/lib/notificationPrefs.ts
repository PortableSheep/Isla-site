// @ts-nocheck
import { getSbClient } from './supabaseClient';
import {
  NotificationPreference,
  NotificationPreferencesInput,
  DigestDay,
} from '@/types/notifications';

const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  email_updates: true,
  email_replies: true,
  email_children: true,
  in_app_updates: true,
  in_app_replies: true,
  in_app_children: true,
  email_frequency: 'immediate',
  digest_day: 'Monday',
  digest_time: '09:00',
};

export function getDefaultPreferences(): Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>  {
  return { ...DEFAULT_PREFERENCES };
}

export async function getUserPreferences(
  userId: string
): Promise<NotificationPreference | null>  {
  const supabase = await getSbClient();
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - return null, caller can create default
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user notification preferences:', error);
    throw error;
  }
}

export async function createPreferences(
  userId: string,
  preferences?: NotificationPreferencesInput
): Promise<NotificationPreference>  {
  const supabase = await getSbClient();
  try {
    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .insert({
        user_id: userId,
        ...getDefaultPreferences(),
        ...preferences,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating notification preferences:', error);
    throw error;
  }
}

export async function savePreferences(
  userId: string,
  preferences: NotificationPreferencesInput
): Promise<NotificationPreference>  {
  const supabase = await getSbClient();
  try {
    // Try to get existing preferences
    const existing = await getUserPreferences(userId);

    if (!existing) {
      // Create new preferences
      return await createPreferences(userId, preferences);
    }

    // Update existing preferences
    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    throw error;
  }
}

export async function updatePreference(
  userId: string,
  key: keyof NotificationPreferencesInput,
  value: any
): Promise<NotificationPreference>  {
  const supabase = await getSbClient();
  try {
    const updateData = { [key]: value };

    const { data, error } = await (supabase
      .from('notification_preferences') as any)
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - create with this preference
        return await createPreferences(userId, { [key]: value });
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating notification preference:', error);
    throw error;
  }
}

export function isValidDigestDay(day: string): day is DigestDay  {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day);
}

export function isValidFrequency(frequency: string): frequency is 'immediate' | 'digest' | 'off'  {
  return ['immediate', 'digest', 'off'].includes(frequency);
}
