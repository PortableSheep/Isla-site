-- Create families table first (for reference)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_family_id ON invite_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires_at ON invite_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_by ON invite_tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_redeemed_by ON invite_tokens(redeemed_by);

-- Enable Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Families RLS Policies
-- Users can view their own families
CREATE POLICY "Users can view their own families" ON families
  FOR SELECT USING (created_by = auth.uid());

-- Users can create families
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own families
CREATE POLICY "Users can update their own families" ON families
  FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Invite Tokens RLS Policies
-- Users can view tokens they created
CREATE POLICY "Users can view tokens they created" ON invite_tokens
  FOR SELECT USING (created_by = auth.uid());

-- Users can view tokens for their families
CREATE POLICY "Users can view tokens for their families" ON invite_tokens
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Users can create tokens
CREATE POLICY "Users can create tokens" ON invite_tokens
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can redeem tokens
CREATE POLICY "Users can redeem tokens" ON invite_tokens
  FOR UPDATE USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON families TO authenticated;
GRANT ALL ON invite_tokens TO authenticated;
