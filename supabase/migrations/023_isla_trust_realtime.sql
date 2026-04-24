-- 023_isla_trust_realtime.sql
--
-- Three improvements:
--  1. Enable REPLICA IDENTITY FULL on posts so Supabase Realtime can deliver
--     row payloads under RLS filtering for the public wall live-feed.
--  2. Add is_trusted_author() helper: a guest cookie is "trusted" once ≥3 of
--     their previous posts/comments have been approved by a moderator.
--  3. Update posts_set_moderation_on_insert trigger:
--       a. role='isla' accounts are auto-approved (like admins).
--       b. trusted guest cookies are auto-approved (system approval, no actor).

-- 1. ---- Realtime: enable full replica identity -------------------------

ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Grant the realtime publication role access (Supabase default; explicit for
-- safety in case the project has a custom publication).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END;
$$;

-- 2. ---- Partial index to make trust checks fast -----------------------

CREATE INDEX IF NOT EXISTS idx_posts_trusted_author
  ON public.posts (author_cookie_id, moderation_status)
  WHERE author_cookie_id IS NOT NULL
    AND moderation_status = 'approved'
    AND deleted_at IS NULL;

-- 3. ---- is_trusted_author helper --------------------------------------
-- Returns TRUE when the given guest cookie has had ≥3 posts or comments
-- approved by a moderator.  STABLE so Postgres can cache within a statement.

CREATE OR REPLACE FUNCTION public.is_trusted_author(p_cookie UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) >= 3
  FROM public.posts
  WHERE author_cookie_id = p_cookie
    AND moderation_status = 'approved'
    AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.is_trusted_author(UUID) TO service_role;

-- 4. ---- Updated insert trigger ----------------------------------------
-- Priority order:
--   1. is_admin(author_id)        → approved  (existing)
--   2. role = 'isla' for author   → approved  (new)
--   3. is_trusted_author(cookie)  → approved, system actor  (new)
--   4. else                       → pending   (existing)

CREATE OR REPLACE FUNCTION public.posts_set_moderation_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Case 1: authenticated admin
  IF NEW.author_id IS NOT NULL AND public.is_admin(NEW.author_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by       := NEW.author_id;
    NEW.approved_at       := NOW();
    NEW.rejected_by       := NULL;
    NEW.rejected_at       := NULL;
    NEW.rejected_reason   := NULL;
    RETURN NEW;
  END IF;

  -- Case 2: Isla account (role = 'isla')
  IF NEW.author_id IS NOT NULL THEN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE user_id = NEW.author_id
    LIMIT 1;

    IF v_role = 'isla' THEN
      NEW.moderation_status := 'approved';
      NEW.approved_by       := NEW.author_id;
      NEW.approved_at       := NOW();
      NEW.rejected_by       := NULL;
      NEW.rejected_at       := NULL;
      NEW.rejected_reason   := NULL;
      RETURN NEW;
    END IF;
  END IF;

  -- Case 3: trusted guest cookie (≥3 previously approved posts)
  IF NEW.author_cookie_id IS NOT NULL AND public.is_trusted_author(NEW.author_cookie_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by       := NULL;   -- system approval, no human actor
    NEW.approved_at       := NOW();
    NEW.rejected_by       := NULL;
    NEW.rejected_at       := NULL;
    NEW.rejected_reason   := NULL;
    RETURN NEW;
  END IF;

  -- Case 4: default — pending moderation
  NEW.moderation_status := 'pending';
  NEW.approved_by       := NULL;
  NEW.approved_at       := NULL;
  NEW.rejected_by       := NULL;
  NEW.rejected_at       := NULL;
  NEW.rejected_reason   := NULL;
  RETURN NEW;
END;
$$;

-- Trigger was already created in 014/017; the OR REPLACE above updates it.
-- Re-create it explicitly in case the earlier migrations used a different name.
DROP TRIGGER IF EXISTS trg_posts_set_moderation ON public.posts;
CREATE TRIGGER trg_posts_set_moderation
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_set_moderation_on_insert();
