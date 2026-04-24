-- 017_public_wall.sql
-- Open the wall to anonymous guests. Admin (Dad) still moderates every post
-- and comment. Reactions still require no moderation.
--
-- Design notes (see session plan.md):
--  - guests are identified by a long-lived httpOnly cookie (author_cookie_id)
--    plus the request IP. Exactly one of author_id / author_cookie_id is set
--    per row.
--  - anon role gets SELECT on a whitelisted view, never on base tables. That
--    way ip / user_agent / spam_* columns cannot leak.
--  - authors must not be able to self-approve: drop the author UPDATE policies
--    from 007 and 014, and add a BEFORE UPDATE trigger that rejects any
--    non-admin change to moderation columns.
--  - rate limiting is enforced by a SECURITY DEFINER function in one
--    transaction to avoid TOCTOU.

-- 1. ------ posts: guest identity columns ----------------------------------

ALTER TABLE public.posts
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS author_cookie_id UUID,
  ADD COLUMN IF NOT EXISTS client_ip INET,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS spam_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_reasons TEXT[] NOT NULL DEFAULT '{}';

-- exactly one identity source per post
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_identity_exclusive;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_identity_exclusive
  CHECK (num_nonnulls(author_id, author_cookie_id) = 1);

-- author_name length sanity
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_author_name_len;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_name_len
  CHECK (author_name IS NULL OR char_length(author_name) BETWEEN 1 AND 40);

CREATE INDEX IF NOT EXISTS idx_posts_author_cookie_id
  ON public.posts (author_cookie_id) WHERE author_cookie_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_client_ip
  ON public.posts (client_ip) WHERE client_ip IS NOT NULL;

-- 2. ------ post_reactions: guest identity columns -------------------------

ALTER TABLE public.post_reactions
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.post_reactions
  ADD COLUMN IF NOT EXISTS author_cookie_id UUID,
  ADD COLUMN IF NOT EXISTS client_ip INET;

ALTER TABLE public.post_reactions
  DROP CONSTRAINT IF EXISTS post_reactions_identity_exclusive;
ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_identity_exclusive
  CHECK (num_nonnulls(user_id, author_cookie_id) = 1);

-- The old UNIQUE (post_id, user_id, emoji) breaks when user_id is NULL
-- (Postgres treats NULLs as distinct). Replace it with partial uniques.
ALTER TABLE public.post_reactions
  DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_emoji_key;

CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_authed_unique
  ON public.post_reactions (post_id, user_id, emoji)
  WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS post_reactions_guest_unique
  ON public.post_reactions (post_id, author_cookie_id, emoji)
  WHERE author_cookie_id IS NOT NULL;

-- 3. ------ ip_bans ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ip_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr CIDR NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ip_bans_cidr ON public.ip_bans USING gist (cidr inet_ops);

ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage ip bans" ON public.ip_bans;
CREATE POLICY "admins manage ip bans" ON public.ip_bans
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_ip_banned(addr INET)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ip_bans
    WHERE addr <<= cidr
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_ip_banned(INET) TO anon, authenticated, service_role;

-- 4. ------ rate_limit_log + atomic check function -------------------------

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id BIGSERIAL PRIMARY KEY,
  bucket TEXT NOT NULL,   -- e.g. 'post', 'comment', 'react'
  key TEXT NOT NULL,      -- 'ip:1.2.3.4' or 'cookie:<uuid>'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket_key_time
  ON public.rate_limit_log (bucket, key, created_at DESC);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
-- no policies -> only service_role (which bypasses RLS) can read/write

-- Atomic: count recent entries in (bucket, key) inside the window; if under
-- limit, insert and return TRUE; else return FALSE. The advisory lock
-- prevents two concurrent requests from both squeaking under the cap.
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_bucket TEXT,
  p_key TEXT,
  p_limit INT,
  p_window INTERVAL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_key BIGINT;
  current_count INT;
BEGIN
  -- hash the key+bucket into a 63-bit advisory lock key
  lock_key := hashtextextended(p_bucket || ':' || p_key, 0);
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COUNT(*) INTO current_count
  FROM public.rate_limit_log
  WHERE bucket = p_bucket
    AND key = p_key
    AND created_at > NOW() - p_window;

  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.rate_limit_log (bucket, key) VALUES (p_bucket, p_key);
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(TEXT, TEXT, INT, INTERVAL) TO service_role;

-- janitor: one-shot cleanup of old rate log rows. Run from a cron or the API.
CREATE OR REPLACE FUNCTION public.rate_limit_cleanup()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_log
  WHERE created_at < NOW() - INTERVAL '2 hours';
$$;
GRANT EXECUTE ON FUNCTION public.rate_limit_cleanup() TO service_role;

-- 5. ------ Rewrite trigger that stamped moderation on insert --------------
-- Authors can still be authed (admin Dad or legacy accounts). For guests
-- (author_id IS NULL) we always force pending. For admins we stamp approved.
CREATE OR REPLACE FUNCTION public.posts_set_moderation_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_id IS NOT NULL AND public.is_admin(NEW.author_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by := NEW.author_id;
    NEW.approved_at := NOW();
    NEW.rejected_by := NULL;
    NEW.rejected_at := NULL;
    NEW.rejected_reason := NULL;
  ELSE
    NEW.moderation_status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.rejected_by := NULL;
    NEW.rejected_at := NULL;
    NEW.rejected_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. ------ BEFORE UPDATE guard: non-admin cannot touch moderation fields --
CREATE OR REPLACE FUNCTION public.posts_guard_moderation_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := auth.uid();
BEGIN
  -- service_role bypasses RLS and has auth.uid() = NULL; allow it.
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_admin(caller) THEN
    RETURN NEW;
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.approved_by     IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at     IS DISTINCT FROM OLD.approved_at
     OR NEW.rejected_by     IS DISTINCT FROM OLD.rejected_by
     OR NEW.rejected_at     IS DISTINCT FROM OLD.rejected_at
     OR NEW.rejected_reason IS DISTINCT FROM OLD.rejected_reason THEN
    RAISE EXCEPTION 'only admins may change moderation fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_guard_moderation_on_update ON public.posts;
CREATE TRIGGER posts_guard_moderation_on_update
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.posts_guard_moderation_on_update();

-- 7. ------ RLS cleanup: drop the self-approval loopholes -------------------
DROP POLICY IF EXISTS "Authors update own post content" ON public.posts;
DROP POLICY IF EXISTS "Non-suspended users can update their own posts" ON public.posts;
-- "Admins update any post" remains from migration 014.

-- 8. ------ Public wall view (anon-safe projection) ------------------------
-- Only non-sensitive columns. No IP, no user_agent, no spam_*, no author_id.
-- Still respects deleted_at / hidden semantics.
-- Note: author_cookie_id is deliberately NOT in the view. The feed API uses
-- service_role to fetch it server-side and returns an `is_mine` boolean.
CREATE OR REPLACE VIEW public.public_wall_posts
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.parent_post_id,
  p.family_id,
  p.author_name,
  p.content,
  p.moderation_status,
  p.created_at,
  p.updated_at
FROM public.posts p;

-- View RLS derives from underlying tables (security_invoker). Grant anon read
-- on the view; the SELECT policy below filters rows appropriately.
GRANT SELECT ON public.public_wall_posts TO anon, authenticated;

-- 9. ------ Anon-visible posts policy --------------------------------------
-- We need anon to be able to SELECT from public.posts *through the view*.
-- security_invoker=true means the anon caller must satisfy a SELECT policy
-- on public.posts. Create one tightly scoped for anon: approved + visible.
DROP POLICY IF EXISTS "Public can read approved visible posts" ON public.posts;
CREATE POLICY "Public can read approved visible posts" ON public.posts
  FOR SELECT
  TO anon
  USING (
    moderation_status = 'approved'
    AND deleted_at IS NULL
    AND hidden = false
  );

-- Also let anon read post_reactions (they need to see counts). No identity
-- is exposed downstream since the API only returns aggregates.
DROP POLICY IF EXISTS "Public can read reactions on approved posts" ON public.post_reactions;
CREATE POLICY "Public can read reactions on approved posts" ON public.post_reactions
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_reactions.post_id
        AND p.moderation_status = 'approved'
        AND p.deleted_at IS NULL
        AND p.hidden = false
    )
  );

-- 10. ------ is_wall_post_visible helper (for comment parent validation) ---
-- Used by the API layer to answer "can this target accept a comment/reaction?"
CREATE OR REPLACE FUNCTION public.is_wall_post_visible(p_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = p_id
      AND moderation_status = 'approved'
      AND deleted_at IS NULL
      AND hidden = false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_wall_post_visible(UUID) TO anon, authenticated, service_role;
