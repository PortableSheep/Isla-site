-- Relax posts identity constraint so a wall post may carry BOTH a guest
-- cookie identity and an auth identity at the same time.
--
-- Background: migration 017 added
--   CHECK (num_nonnulls(author_id, author_cookie_id) = 1)
-- so a post had to be guest-only XOR auth-only. With the new public
-- wall magic-link sign-in we want to attach the auth user_id to a post
-- (for the verified ✨ marker) WITHOUT abandoning the existing cookie
-- identity that drives trust heuristics, name uniqueness, "is_mine"
-- detection, and the partial indexes on author_cookie_id.
--
-- Posts must still have at least one identity source — anonymous posts
-- with neither column set remain rejected.

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_identity_exclusive;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_identity_present
  CHECK (num_nonnulls(author_id, author_cookie_id) >= 1);
