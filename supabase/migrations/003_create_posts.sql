-- Create posts table for family wall
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  hidden BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  flag_count INTEGER DEFAULT 0,
  is_update BOOLEAN DEFAULT false
);

-- Create post_flags table for moderation tracking
CREATE TABLE IF NOT EXISTS post_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_family_id_created_at ON posts(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_post_id ON posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_posts_hidden ON posts(hidden);
CREATE INDEX IF NOT EXISTS idx_posts_flagged ON posts(flagged);
CREATE INDEX IF NOT EXISTS idx_post_flags_post_id ON post_flags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_flags_flagged_by ON post_flags(flagged_by);
CREATE INDEX IF NOT EXISTS idx_post_flags_status ON post_flags(status);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_flags ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies
-- Users can view posts from their families (excluding deleted posts)
CREATE POLICY "Users can view family posts" ON posts
  FOR SELECT USING (
    family_id IN (
      SELECT id FROM families 
      WHERE created_by = auth.uid()
      UNION
      SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
    AND (hidden = false OR auth.uid() IN (
      SELECT created_by FROM families WHERE id = family_id
    ))
  );

-- Users can view deleted posts if they're admins/parents of the family
CREATE POLICY "Admins can view deleted posts" ON posts
  FOR SELECT USING (
    deleted_at IS NOT NULL
    AND family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Users can create posts in their families
CREATE POLICY "Users can create posts in their families" ON posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND family_id IN (
      SELECT id FROM families 
      WHERE created_by = auth.uid()
      UNION
      SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Users can soft delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Only family admins can hide posts
CREATE POLICY "Admins can hide posts" ON posts
  FOR UPDATE USING (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE created_by = auth.uid()
    )
  );

-- Post Flags RLS Policies
-- Users can create flags
CREATE POLICY "Users can flag posts" ON post_flags
  FOR INSERT WITH CHECK (
    flagged_by = auth.uid()
    AND post_id IN (
      SELECT id FROM posts
      WHERE family_id IN (
        SELECT id FROM families 
        WHERE created_by = auth.uid()
        UNION
        SELECT family_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Family admins can view all flags for their families
CREATE POLICY "Admins can view post flags" ON post_flags
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts
      WHERE family_id IN (
        SELECT id FROM families WHERE created_by = auth.uid()
      )
    )
  );

-- Grant permissions
GRANT ALL ON posts TO authenticated;
GRANT ALL ON post_flags TO authenticated;
