-- Allow anonymous (wall) push subscriptions.
-- Wall users do not have auth.users accounts; they subscribe via cookie/browser only.

-- Drop the existing FK constraint (auto-generated name varies; use a guarded approach).
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;

-- Re-add FK as nullable (allow NULL for anonymous subs).
ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old (user_id, endpoint) unique constraint and replace with a global endpoint unique.
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- RLS policies: allow anonymous (anon) and authenticated users to manage subscriptions
-- by endpoint. Subscriptions are bound to a browser endpoint, which is itself a secret.

DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

-- Anyone can insert a subscription. The API route validates the payload.
CREATE POLICY "Anyone can insert push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Reads: only via service role (used for sending pushes server-side). No direct client reads.
-- (No SELECT policy means RLS denies all client reads.)

-- Anyone can delete by endpoint (the endpoint itself is the secret). The API route handles this.
CREATE POLICY "Anyone can delete push subscriptions" ON push_subscriptions
  FOR DELETE USING (true);

GRANT INSERT, DELETE ON push_subscriptions TO anon;
GRANT INSERT, DELETE ON push_subscriptions TO authenticated;
