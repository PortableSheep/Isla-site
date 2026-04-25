-- Fix for migration 020: pg_net exposes its functions in the `net` schema,
-- not under `extensions.net`. Postgres parses `extensions.net.http_post`
-- as database.schema.function and fails with:
--   "cross-database references are not implemented"
--
-- Rewrite the trigger function to call `net.http_post` and ensure `net`
-- is on the search_path.

CREATE OR REPLACE FUNCTION public.trigger_moderation_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  cfg            JSONB;
  webhook_url    TEXT;
  webhook_secret TEXT;
  should_fire    BOOLEAN := FALSE;
BEGIN
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

  IF webhook_url IS NULL OR webhook_url = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
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
