-- Create users table extension for child profiles and approval status
-- This assumes users table exists from auth.users, we just need to track additional metadata

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'child',
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create child_approvals audit table for compliance and history
CREATE TABLE IF NOT EXISTS child_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  approved_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_id ON user_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_child_approvals_child_id ON child_approvals(child_id);
CREATE INDEX IF NOT EXISTS idx_child_approvals_family_id ON child_approvals(family_id);
CREATE INDEX IF NOT EXISTS idx_child_approvals_created_at ON child_approvals(created_at);
CREATE INDEX IF NOT EXISTS idx_child_approvals_approved_by ON child_approvals(approved_by);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_approvals ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Parents can view profiles in their families
CREATE POLICY "Parents can view family profiles" ON user_profiles
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Parents can update child profiles (for approval status)
CREATE POLICY "Parents can update child profiles in their family" ON user_profiles
  FOR UPDATE USING (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  ) WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Child Approvals RLS Policies
-- Parents can view approvals for their families
CREATE POLICY "Parents can view family approvals" ON child_approvals
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Parents can create approval records for their families
CREATE POLICY "Parents can create approvals for their family" ON child_approvals
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    ) AND approved_by = auth.uid()
  );

-- Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON child_approvals TO authenticated;
