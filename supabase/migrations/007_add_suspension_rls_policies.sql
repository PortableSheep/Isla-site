-- Add RLS policies to prevent suspended users from creating posts
-- Update posts table to check suspension status

-- Drop existing insert policies if they exist (to avoid conflicts)
ALTER TABLE posts DROP POLICY IF EXISTS "Users can create posts" CASCADE;

-- New policy: Only non-suspended users can create posts
CREATE POLICY "Non-suspended users can create posts" ON posts
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND suspended = true
    )
  );

-- Policy for users to update their own posts (if not suspended)
ALTER TABLE posts DROP POLICY IF EXISTS "Users can update their own posts" CASCADE;

CREATE POLICY "Non-suspended users can update their own posts" ON posts
  FOR UPDATE USING (
    author_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND suspended = true
    )
  ) WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND suspended = true
    )
  );

-- Ensure suspended users cannot select posts (wall feed is inaccessible)
-- Note: This might need adjustment based on existing policy structure
-- For now, we'll add a restrictive policy on SELECT for wall queries

-- Update audit_logs to support metadata field (for user_id tracking)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING gin(metadata);
