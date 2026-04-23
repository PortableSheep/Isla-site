-- Expand audit_logs table for comprehensive audit logging
-- This migration updates the audit_logs table to support full audit trail tracking

-- Drop old audit_logs table and recreate with full schema
DROP TABLE IF EXISTS audit_logs CASCADE;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_role VARCHAR(20) NOT NULL DEFAULT 'admin',
  subject_type VARCHAR(20) NOT NULL,
  subject_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_subject_id ON audit_logs(subject_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_subject_type ON audit_logs(subject_type);
CREATE INDEX idx_audit_logs_family_id ON audit_logs(family_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_action ON audit_logs(actor_id, action);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Only admins can view audit logs (read-only for admins)
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Family admins can view logs for their family
CREATE POLICY "Family admins can view family audit logs" ON audit_logs
  FOR SELECT USING (
    family_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM families 
      WHERE created_by = auth.uid()
      AND id = audit_logs.family_id
    )
  );

-- System (authenticated users) can insert audit logs (append-only)
CREATE POLICY "Authenticated can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NO UPDATE policy - audit logs are immutable
-- NO DELETE policy - audit logs are immutable

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Add retention policy comment for documentation
COMMENT ON TABLE audit_logs IS 'Append-only audit log for all moderation and administrative actions. Retained for 6+ months for compliance. No UPDATE or DELETE allowed.';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for this audit log entry';
COMMENT ON COLUMN audit_logs.action IS 'Type of action: post_deleted, post_hidden, user_suspended, etc.';
COMMENT ON COLUMN audit_logs.actor_id IS 'User ID who performed the action';
COMMENT ON COLUMN audit_logs.actor_role IS 'Role of the actor at the time of the action (admin, parent, child, system)';
COMMENT ON COLUMN audit_logs.subject_type IS 'Type of subject affected: post, user, flag, profile, appeal';
COMMENT ON COLUMN audit_logs.subject_id IS 'ID of the subject that was affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Flexible JSONB field for action-specific data (old_value, new_value, etc.)';
COMMENT ON COLUMN audit_logs.created_at IS 'Immutable timestamp when action occurred (cannot be updated)';
