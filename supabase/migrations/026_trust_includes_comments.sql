-- 026_trust_includes_comments.sql
--
-- Revise the trust heuristic so that approved comments also contribute toward
-- earning auto-approval. The previous formula (025) required ≥3 human-approved
-- top-level posts, which excluded users who engage primarily via comments.
--
-- New weighted formula:
--   (human-approved top-level posts × 2) + approved comments ≥ 6
--
-- Examples:
--   3 posts  + 0 comments = 6 → trusted
--   2 posts  + 2 comments = 6 → trusted
--   1 post   + 4 comments = 6 → trusted
--   0 posts  + 6 comments = 6 → trusted (comment-only engagement)
--   0 posts  + 5 comments = 5 → NOT trusted
--   2 posts  + 1 comment  = 5 → NOT trusted

CREATE OR REPLACE FUNCTION public.is_trusted_author(p_cookie UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    -- top-level posts approved by a human moderator (weighted ×2)
    COUNT(*) FILTER (
      WHERE parent_post_id IS NULL
        AND moderation_status = 'approved'
        AND approved_by IS NOT NULL
        AND deleted_at IS NULL
    ) * 2
    +
    -- approved comments (top-level or replies, any approval source)
    COUNT(*) FILTER (
      WHERE parent_post_id IS NOT NULL
        AND moderation_status = 'approved'
        AND deleted_at IS NULL
    )
  ) >= 6
  FROM public.posts
  WHERE author_cookie_id = p_cookie;
$$;

-- Update the partial index to cover both paths.
-- The previous index only covered top-level human-approved posts; we now
-- also need fast access to approved comments.
DROP INDEX IF EXISTS idx_posts_trusted_author;

CREATE INDEX idx_posts_trusted_author_posts
  ON public.posts (author_cookie_id, moderation_status)
  WHERE author_cookie_id IS NOT NULL
    AND parent_post_id    IS NULL
    AND moderation_status = 'approved'
    AND approved_by       IS NOT NULL
    AND deleted_at        IS NULL;

CREATE INDEX idx_posts_trusted_author_comments
  ON public.posts (author_cookie_id, moderation_status)
  WHERE author_cookie_id IS NOT NULL
    AND parent_post_id    IS NOT NULL
    AND moderation_status = 'approved'
    AND deleted_at        IS NULL;
