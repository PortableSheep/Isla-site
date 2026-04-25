export type NotificationFrequency = 'immediate' | 'digest' | 'off';
export type DigestDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type NotificationType = 'updates' | 'replies' | 'children';

export interface NotificationPreference {
  id: string;
  user_id: string;
  
  // Email notification toggles
  email_updates: boolean;
  email_replies: boolean;
  email_children: boolean;
  
  // In-app notification toggles
  in_app_updates: boolean;
  in_app_replies: boolean;
  in_app_children: boolean;
  
  // Frequency settings
  email_frequency: NotificationFrequency;
  
  // Push notification opt-in
  push_notifications_enabled: boolean;

  // Digest preferences
  digest_day: DigestDay;
  digest_time: string; // HH:MM format
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesInput {
  email_updates?: boolean;
  email_replies?: boolean;
  email_children?: boolean;
  in_app_updates?: boolean;
  in_app_replies?: boolean;
  in_app_children?: boolean;
  email_frequency?: NotificationFrequency;
  digest_day?: DigestDay;
  digest_time?: string;
  push_notifications_enabled?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'update' | 'reply' | 'child_approved' | 'child_rejected';
  post_id: string | null;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  link: string;
}

export interface NotificationCreateInput {
  user_id: string;
  type: Notification['type'];
  post_id?: string | null;
  title: string;
  message: string;
  link: string;
}

export interface NotificationQueue {
  id: string;
  user_id: string;
  notification_id: string | null;
  notification_type: string;
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}
