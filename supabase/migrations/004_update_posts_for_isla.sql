-- Update posts table to allow family_id to be NULL for Isla-wide posts
-- Alter the family_id column to allow NULL values
ALTER TABLE posts ALTER COLUMN family_id DROP NOT NULL;

-- Add an index for all-family posts
CREATE INDEX IF NOT EXISTS idx_posts_isla_posts ON posts(family_id) WHERE family_id IS NULL AND deleted_at IS NULL AND hidden = false;

-- Update RLS policies to include Isla posts
-- First, drop the existing "Users can view family posts" policy
DROP POLICY IF EXISTS "Users can view family posts" ON posts;

-- Create a new policy that includes both family posts and Isla posts
CREATE POLICY "Users can view family posts and isla posts" ON posts
  FOR SELECT USING (
    (family_id IN (
      SELECT id FROM families 
      WHERE created_by = auth.uid()
      UNION
      SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
    AND (hidden = false OR auth.uid() IN (
      SELECT created_by FROM families WHERE id = family_id
    )))
    OR
    (family_id IS NULL AND deleted_at IS NULL AND hidden = false)
  );

-- Update the insert policy to allow Isla to create posts with NULL family_id
DROP POLICY IF EXISTS "Users can create posts in their families" ON posts;

CREATE POLICY "Users can create posts in their families" ON posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND (
      family_id IN (
        SELECT id FROM families 
        WHERE created_by = auth.uid()
        UNION
        SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
      )
      OR
      (family_id IS NULL AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'isla'
      ))
    )
  );
