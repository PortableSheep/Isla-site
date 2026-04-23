import { supabase } from './supabase';

export async function isIslaUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'isla')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking Isla user:', error);
    return false;
  }
}

export async function getIslaUserProfile() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'isla')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching Isla profile:', error);
    return null;
  }
}
