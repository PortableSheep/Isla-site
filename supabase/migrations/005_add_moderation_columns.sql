-- Add moderation-related columns to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_reason VARCHAR(100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_reason_text TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_reason VARCHAR(100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_reason_text TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;

-- Create audit_logs table for tracking all moderation actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_post_id ON audit_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policy - only admins can view
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families 
      WHERE created_by = auth.uid()
      AND id = (SELECT family_id FROM posts WHERE id = audit_logs.post_id)
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only system/authenticated users can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update posts index for hidden_at
CREATE INDEX IF NOT EXISTS idx_posts_hidden_at ON posts(hidden_at);

-- Grant permissions
GRANT ALL ON audit_logs TO authenticated;
