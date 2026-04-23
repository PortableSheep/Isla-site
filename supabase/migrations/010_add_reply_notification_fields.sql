-- Add fields to notification_queue for reply notification grouping
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE notification_queue ADD COLUMN IF NOT EXISTS reply_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- Create index for grouping replies by thread
CREATE INDEX IF NOT EXISTS idx_notification_queue_thread_id ON notification_queue(user_id, thread_id);
