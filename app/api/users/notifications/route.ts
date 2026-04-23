import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getUserPreferences,
  createPreferences,
  savePreferences,
  isValidFrequency,
  isValidDigestDay,
} from '@/lib/notificationPrefs';
import { NotificationPreferencesInput } from '@/types/notifications';

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await getUserPreferences(user.id);

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await createPreferences(user.id);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationError = validatePreferences(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const preferences = await savePreferences(user.id, body);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationError = validatePreferences(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const preferences = await savePreferences(user.id, body);

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function validatePreferences(preferences: NotificationPreferencesInput): string | null {
  if (preferences.email_frequency && !isValidFrequency(preferences.email_frequency)) {
    return 'Invalid email_frequency. Must be "immediate", "digest", or "off"';
  }

  if (preferences.digest_day && !isValidDigestDay(preferences.digest_day)) {
    return 'Invalid digest_day. Must be a valid day of the week';
  }

  if (preferences.digest_time) {
    if (!isValidTimeFormat(preferences.digest_time)) {
      return 'Invalid digest_time. Must be in HH:MM format';
    }
  }

  if (
    preferences.email_updates !== undefined &&
    typeof preferences.email_updates !== 'boolean'
  ) {
    return 'email_updates must be a boolean';
  }

  if (
    preferences.email_replies !== undefined &&
    typeof preferences.email_replies !== 'boolean'
  ) {
    return 'email_replies must be a boolean';
  }

  if (
    preferences.email_children !== undefined &&
    typeof preferences.email_children !== 'boolean'
  ) {
    return 'email_children must be a boolean';
  }

  if (
    preferences.in_app_updates !== undefined &&
    typeof preferences.in_app_updates !== 'boolean'
  ) {
    return 'in_app_updates must be a boolean';
  }

  if (
    preferences.in_app_replies !== undefined &&
    typeof preferences.in_app_replies !== 'boolean'
  ) {
    return 'in_app_replies must be a boolean';
  }

  if (
    preferences.in_app_children !== undefined &&
    typeof preferences.in_app_children !== 'boolean'
  ) {
    return 'in_app_children must be a boolean';
  }

  return null;
}

function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}
