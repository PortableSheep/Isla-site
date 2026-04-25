-- Site settings: key-value store for runtime configuration (e.g. maintenance mode).
-- Read by the middleware on every request (with short in-memory cache).
-- Admin-only writes via service role key.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow anon/authenticated to read settings (needed by edge middleware anon client).
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only service role (used by admin API) can write.
CREATE POLICY "Service role write site_settings"
  ON public.site_settings FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed default settings.
INSERT INTO public.site_settings (key, value) VALUES
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
