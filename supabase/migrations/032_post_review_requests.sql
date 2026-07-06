-- Allow users/guests to request a moderator re-review for rejected posts.
CREATE TABLE IF NOT EXISTS public.post_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_cookie_id TEXT,
  request_message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_review_requests_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'escalated'))
);

CREATE INDEX IF NOT EXISTS idx_post_review_requests_post_id
  ON public.post_review_requests (post_id);

CREATE INDEX IF NOT EXISTS idx_post_review_requests_status_created_at
  ON public.post_review_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_review_requests_requester_user
  ON public.post_review_requests (requester_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_review_requests_requester_cookie
  ON public.post_review_requests (requester_cookie_id, created_at DESC);

ALTER TABLE public.post_review_requests ENABLE ROW LEVEL SECURITY;

-- Admin-only visibility/update from regular clients; service-role API routes can bypass.
CREATE POLICY "Admins view post review requests"
  ON public.post_review_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins update post review requests"
  ON public.post_review_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );
