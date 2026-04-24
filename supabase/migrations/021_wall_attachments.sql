-- 021_wall_attachments.sql
-- Direct image uploads for the public wall (posts + comments).
-- Files live in a PRIVATE Supabase Storage bucket "wall-uploads" and are
-- served via signed URLs minted by the feed API. Visibility mirrors the
-- existing text/URL embed rule:
--   poster (author_cookie_id / author_id) OR admin OR moderation_status = 'approved'
-- All access goes through service-role server routes; anon/authenticated
-- never touch this table directly (no RLS policies => locked down by RLS-on).

-- 1. Private storage bucket for uploaded images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wall-uploads', 'wall-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Defensive: even though the bucket is private, ensure no anon/authenticated
-- storage.objects policies cover this bucket. Only service_role can read/write.
-- (No policy == no access for non-service-role under RLS.)

-- 2. Attachments table. One row per uploaded image.
--    post_id is NULLABLE so we can create the row at upload time and attach
--    it to a post atomically later (prevents race where the post is created
--    before the upload finishes).
CREATE TABLE IF NOT EXISTS public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_cookie_id UUID,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_attachments_identity_present
    CHECK (num_nonnulls(author_cookie_id, author_id) >= 1),
  CONSTRAINT post_attachments_mime_whitelist
    CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp', 'image/gif')),
  CONSTRAINT post_attachments_byte_size_positive
    CHECK (byte_size > 0 AND byte_size <= 8388608)
);

CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id
  ON public.post_attachments (post_id) WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_attachments_orphans
  ON public.post_attachments (created_at) WHERE post_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_post_attachments_author_cookie
  ON public.post_attachments (author_cookie_id)
  WHERE author_cookie_id IS NOT NULL;

-- 3. RLS ON with no policies: service_role bypasses, everyone else is denied.
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Add 'upload' to the rate-limit buckets by convention (no schema change
--    needed — rate_limit_log.bucket is free-form TEXT). Documented here.

-- 5. Permissions: deny all direct grants; API routes use service role.
REVOKE ALL ON public.post_attachments FROM anon, authenticated;
