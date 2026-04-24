-- Simple key/value store for cron watermarks and similar small pieces of
-- server-side state. Intentionally tiny + service-role only.
CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_state ENABLE ROW LEVEL SECURITY;

-- No policies: only the service-role key (which bypasses RLS) should touch
-- this table. Authenticated/anon clients get nothing.
