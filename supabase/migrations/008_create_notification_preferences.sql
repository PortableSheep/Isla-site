-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notification toggles
  email_updates BOOLEAN DEFAULT TRUE,
  email_replies BOOLEAN DEFAULT TRUE,
  email_children BOOLEAN DEFAULT TRUE,
  
  -- In-app notification toggles
  in_app_updates BOOLEAN DEFAULT TRUE,
  in_app_replies BOOLEAN DEFAULT TRUE,
  in_app_children BOOLEAN DEFAULT TRUE,
  
  -- Frequency settings
  email_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'digest', 'off')),
  
  -- Digest preferences
  digest_day VARCHAR(20) DEFAULT 'Monday' CHECK (digest_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  digest_time TIME DEFAULT '09:00',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can create their own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users cannot delete their preferences (we just disable instead)
CREATE POLICY "Prevent deletion of notification preferences" ON notification_preferences
  FOR DELETE USING (FALSE);
