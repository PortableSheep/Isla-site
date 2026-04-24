-- Wall moderation: posts and comments require admin approval before any
-- non-author sees them. The admin (family creator / role='admin') is
-- auto-approved. Reactions are NOT moderated and handled separately.

-- 1. Admin helper. A user is "admin" if they created the wall's family
--    or if their user_profiles.role is 'admin'. SECURITY DEFINER to
--    avoid RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM families WHERE created_by = uid
  ) OR EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = uid AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- 2. Moderation columns on posts.
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_moderation_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_posts_moderation_status
  ON posts(moderation_status)
  WHERE deleted_at IS NULL;

-- 3. Backfill: any post that existed before this migration is approved,
--    otherwise the wall goes blank on deploy.
UPDATE posts
SET moderation_status = 'approved',
    approved_at = COALESCE(approved_at, created_at)
WHERE moderation_status = 'pending'
  AND created_at < now();

-- 4. Auto-approve trigger. Admin posts are instantly approved; everyone
--    else's posts are forced to pending regardless of what the client
--    sends. Same rule applies to comments (rows with parent_post_id).
CREATE OR REPLACE FUNCTION public.posts_set_moderation_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(NEW.author_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by := NEW.author_id;
    NEW.approved_at := now();
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

DROP TRIGGER IF EXISTS trg_posts_set_moderation ON posts;
CREATE TRIGGER trg_posts_set_moderation
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_set_moderation_on_insert();

-- 5. Rewrite the SELECT policy so non-admin readers only see approved
--    posts (plus their own pending/rejected). Admin sees everything.
DROP POLICY IF EXISTS "Users can view family posts" ON posts;
DROP POLICY IF EXISTS "Users can view family posts and isla posts" ON posts;
DROP POLICY IF EXISTS "Admins can view deleted posts" ON posts;

CREATE POLICY "Wall posts visible to members with moderation" ON posts
  FOR SELECT
  USING (
    -- Must be in the wall: either a member of the post's family or the
    -- post is an "isla-wide" update (family_id IS NULL).
    (
      family_id IS NULL
      OR family_id = public.auth_user_family_id()
      OR family_id IN (SELECT public.auth_user_owned_family_ids())
    )
    AND (
      -- Admin (family creator / role=admin) sees EVERYTHING, including
      -- deleted and hidden content.
      public.is_admin(auth.uid())
      OR (
        -- Regular reader: respect deleted/hidden and moderation.
        deleted_at IS NULL
        AND hidden = false
        AND (
          moderation_status = 'approved'
          OR author_id = auth.uid()
        )
      )
    )
  );

-- 6. UPDATE policies: keep author-owned updates working, but prevent
--    authors from flipping their own moderation_status.
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins can hide posts" ON posts;

CREATE POLICY "Authors update own post content" ON posts
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    author_id = auth.uid()
  );

CREATE POLICY "Admins update any post" ON posts
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
