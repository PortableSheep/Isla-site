-- Add suspension fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspension_reason_text TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspension_duration_days INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS appeal_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS appeal_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create suspension_appeals table
CREATE TABLE IF NOT EXISTS suspension_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appeal_text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for suspension_appeals
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_user_id ON suspension_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_status ON suspension_appeals(status);
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_created_at ON suspension_appeals(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_suspended ON user_profiles(suspended);
CREATE INDEX IF NOT EXISTS idx_user_profiles_suspension_expires_at ON user_profiles(suspension_expires_at);

-- Enable RLS for suspension_appeals
ALTER TABLE suspension_appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suspension_appeals
-- Users can view their own appeals
CREATE POLICY "Users can view their own appeals" ON suspension_appeals
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" ON suspension_appeals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create their own appeals
CREATE POLICY "Users can create appeals" ON suspension_appeals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can update appeals
CREATE POLICY "Admins can update appeals" ON suspension_appeals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON suspension_appeals TO authenticated;

-- Add suspension action to audit_logs by adding entry when a user is suspended
-- This is handled by application logic, but we can add it to user_profiles RLS policies
-- Update user_profiles RLS to restrict suspended users

-- Policy: Suspended users cannot update their profiles
DROP POLICY IF EXISTS "Users can update their own profiles" ON user_profiles;

CREATE POLICY "Users can update their own profiles" ON user_profiles
  FOR UPDATE USING (
    user_id = auth.uid() 
    AND NOT suspended
  ) WITH CHECK (
    user_id = auth.uid()
    AND NOT suspended
  );

-- Policy: Allow admins to suspend users (update suspended status)
CREATE POLICY "Admins can suspend and unsuspend users" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
