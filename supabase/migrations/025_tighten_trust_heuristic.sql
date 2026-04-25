-- 025_tighten_trust_heuristic.sql
--
-- Tighten the trust heuristic so only top-level posts that were explicitly
-- approved by a human moderator (approved_by IS NOT NULL) count toward the
-- trusted-author threshold.
--
-- Previously, comments and system-auto-approved rows both contributed to
-- the count, which could grant trust unexpectedly (e.g. 1 post + 2 comments
-- = 3 ≥ 3 → trusted). The updated function requires 3 real, moderated,
-- top-level posts approved by a human.

CREATE OR REPLACE FUNCTION public.is_trusted_author(p_cookie UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COUNT(*) >= 3
  FROM public.posts
  WHERE author_cookie_id  = p_cookie
    AND parent_post_id    IS NULL          -- top-level posts only (not comments)
    AND moderation_status = 'approved'
    AND approved_by       IS NOT NULL      -- must have been approved by a human
    AND deleted_at        IS NULL;
$$;

-- Update the partial index to match the new criteria so the function stays fast.
DROP INDEX IF EXISTS idx_posts_trusted_author;
CREATE INDEX idx_posts_trusted_author
  ON public.posts (author_cookie_id, moderation_status)
  WHERE author_cookie_id IS NOT NULL
    AND parent_post_id    IS NULL
    AND moderation_status = 'approved'
    AND approved_by       IS NOT NULL
    AND deleted_at        IS NULL;
