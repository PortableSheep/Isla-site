-- 027_ai_content_moderation.sql
--
-- Updates the posts insert trigger to force moderation_status = 'pending'
-- when pre-insert checks have injected 'ai_flagged' or 'flagged_url' into
-- spam_reasons.
--
-- Priority order (updated):
--   1. is_admin(author_id)              → approved  (unchanged)
--   2. role = 'isla' for author         → approved  (unchanged)
--   2.5 spam_reasons contains AI/URL flag → pending   (NEW — skipped for admin/isla)
--   3. is_trusted_author(cookie)        → approved  (unchanged)
--   4. else                             → pending   (unchanged)

CREATE OR REPLACE FUNCTION public.posts_set_moderation_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Case 1: authenticated admin
  IF NEW.author_id IS NOT NULL AND public.is_admin(NEW.author_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by       := NEW.author_id;
    NEW.approved_at       := NOW();
    NEW.rejected_by       := NULL;
    NEW.rejected_at       := NULL;
    NEW.rejected_reason   := NULL;
    RETURN NEW;
  END IF;

  -- Case 2: Isla account (role = 'isla')
  IF NEW.author_id IS NOT NULL THEN
    SELECT role INTO v_role
    FROM public.user_profiles
    WHERE user_id = NEW.author_id
    LIMIT 1;

    IF v_role = 'isla' THEN
      NEW.moderation_status := 'approved';
      NEW.approved_by       := NEW.author_id;
      NEW.approved_at       := NOW();
      NEW.rejected_by       := NULL;
      NEW.rejected_at       := NULL;
      NEW.rejected_reason   := NULL;
      RETURN NEW;
    END IF;
  END IF;

  -- Case 2.5: AI content flag or unknown URL — force pending regardless of trust.
  -- Only reached by guest posts (admin and isla accounts returned above).
  IF NEW.spam_reasons IS NOT NULL
     AND NEW.spam_reasons && ARRAY['ai_flagged', 'flagged_url'] THEN
    NEW.moderation_status := 'pending';
    NEW.approved_by       := NULL;
    NEW.approved_at       := NULL;
    NEW.rejected_by       := NULL;
    NEW.rejected_at       := NULL;
    NEW.rejected_reason   := NULL;
    RETURN NEW;
  END IF;

  -- Case 3: trusted guest cookie (weighted formula from migration 026)
  IF NEW.author_cookie_id IS NOT NULL AND public.is_trusted_author(NEW.author_cookie_id) THEN
    NEW.moderation_status := 'approved';
    NEW.approved_by       := NULL;
    NEW.approved_at       := NOW();
    NEW.rejected_by       := NULL;
    NEW.rejected_at       := NULL;
    NEW.rejected_reason   := NULL;
    RETURN NEW;
  END IF;

  -- Case 4: default — pending moderation
  NEW.moderation_status := 'pending';
  NEW.approved_by       := NULL;
  NEW.approved_at       := NULL;
  NEW.rejected_by       := NULL;
  NEW.rejected_at       := NULL;
  NEW.rejected_reason   := NULL;
  RETURN NEW;
END;
$$;

-- The trigger itself already exists from migration 023; the OR REPLACE above
-- updates the function in place with no need to drop/recreate the trigger.
