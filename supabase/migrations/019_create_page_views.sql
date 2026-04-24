-- Homegrown site analytics. Captures one row per page view from the edge
-- middleware. Raw IPs are never stored — `visitor_hash` is a SHA-256 of
-- (ip || user-agent || daily salt), so the same visitor is recognizable
-- within a day but not across days, and IPs can't be reversed.
--
-- Reads are locked down to admins (same rule as the rest of /admin).
-- Inserts are performed with the service role key from middleware, which
-- bypasses RLS, so we explicitly deny INSERT/UPDATE/DELETE for everyone
-- else.

CREATE TABLE IF NOT EXISTS public.page_views (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  path           TEXT        NOT NULL,
  referrer       TEXT,
  user_agent     TEXT,
  device_type    TEXT CHECK (device_type IN ('mobile','tablet','desktop','bot','unknown')) DEFAULT 'unknown',
  country        TEXT,
  region         TEXT,
  city           TEXT,
  visitor_hash   TEXT NOT NULL,
  session_id     UUID NOT NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_path_created_at
  ON public.page_views (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_geo
  ON public.page_views (country, region, city);

CREATE INDEX IF NOT EXISTS idx_page_views_session
  ON public.page_views (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor
  ON public.page_views (visitor_hash, created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Admin-only read.
DROP POLICY IF EXISTS page_views_admin_select ON public.page_views;
CREATE POLICY page_views_admin_select
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- No direct writes — the service role bypasses RLS and is used from the
-- middleware. These explicit denials make intent clear and keep anon /
-- authenticated clients from ever writing analytics rows.
DROP POLICY IF EXISTS page_views_no_insert ON public.page_views;
CREATE POLICY page_views_no_insert
  ON public.page_views
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

DROP POLICY IF EXISTS page_views_no_update ON public.page_views;
CREATE POLICY page_views_no_update
  ON public.page_views
  FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS page_views_no_delete ON public.page_views;
CREATE POLICY page_views_no_delete
  ON public.page_views
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- Retention helper. Call manually or via pg_cron to trim rows older than
-- 90 days. Intentionally not scheduled here so the migration stays inert.
CREATE OR REPLACE FUNCTION public.prune_page_views(older_than_days INT DEFAULT 90)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.page_views
    WHERE created_at < now() - make_interval(days => older_than_days)
    RETURNING 1
  )
  SELECT COALESCE(COUNT(*), 0)::INT FROM deleted;
$$;

REVOKE ALL ON FUNCTION public.prune_page_views(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_page_views(INT) TO service_role;
