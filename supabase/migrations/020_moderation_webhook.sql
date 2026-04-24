-- Instant moderation alerts via Supabase database trigger + pg_net.
--
-- When a post (or comment — same table) lands with
-- `moderation_status='pending'`, fire an HTTP POST to the app's webhook
-- endpoint. The endpoint re-queries the DB and sends one coalesced
-- email per burst, so rapid-fire inserts don't spam.
--
-- Configuration lives in the `system_state` row with key
-- 'moderation_webhook'. Update it with the deployed URL + secret after
-- running this migration, e.g.:
--
--   UPDATE system_state
--   SET value = jsonb_build_object(
--     'url', 'https://isla.site/api/hooks/moderation-event',
--     'secret', '<MODERATION_WEBHOOK_SECRET from Vercel env>'
--   ),
--   updated_at = now()
--   WHERE key = 'moderation_webhook';

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Seed a placeholder config row. The webhook trigger is a no-op until
-- this row has a non-empty `url`.
INSERT INTO public.system_state (key, value)
VALUES ('moderation_webhook', jsonb_build_object('url', null, 'secret', null))
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.trigger_moderation_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  cfg            JSONB;
  webhook_url    TEXT;
  webhook_secret TEXT;
  should_fire    BOOLEAN := FALSE;
BEGIN
  -- Only act on pending, non-deleted rows. UPDATE is gated on
  -- moderation_status actually transitioning to 'pending' to avoid
  -- re-firing on unrelated column changes.
  IF TG_OP = 'INSERT' THEN
    should_fire := (NEW.moderation_status = 'pending' AND NEW.deleted_at IS NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    should_fire := (
      NEW.moderation_status = 'pending'
      AND NEW.deleted_at IS NULL
      AND (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status)
    );
  END IF;

  IF NOT should_fire THEN
    RETURN NEW;
  END IF;

  SELECT value INTO cfg FROM public.system_state WHERE key = 'moderation_webhook';
  webhook_url := cfg->>'url';
  webhook_secret := cfg->>'secret';

  -- No-op until the admin configures the URL.
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- pg_net posts asynchronously; the row insert / update is never blocked
  -- by the HTTP call or the app's response time.
  PERFORM extensions.net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(webhook_secret, '')
    ),
    body    := jsonb_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'record_id', NEW.id::text,
      'parent_post_id', NEW.parent_post_id::text,
      'moderation_status', NEW.moderation_status,
      'created_at', NEW.created_at
    ),
    timeout_milliseconds := 2000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_moderation_alert ON public.posts;
CREATE TRIGGER trg_posts_moderation_alert
AFTER INSERT OR UPDATE OF moderation_status ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_moderation_alert();
