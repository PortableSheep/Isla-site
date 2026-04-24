-- Friend signup: when a new user signs up (email/password), automatically
-- create a user_profiles row tied to Isla's family so they can view the
-- wall and create (pending) posts.
--
-- One-family assumption: this app has a single wall. The function picks
-- the earliest-created family row as the target.

CREATE OR REPLACE FUNCTION public.isla_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM families ORDER BY created_at ASC LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.isla_family_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_friend_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_family_id uuid;
BEGIN
  -- If this user already has a profile (e.g. admin created manually),
  -- leave them alone.
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO target_family_id
  FROM public.families
  ORDER BY created_at ASC
  LIMIT 1;

  -- No family yet = pre-setup. Skip silently; admin will create manually.
  IF target_family_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_profiles (user_id, family_id, role, status)
  VALUES (NEW.id, target_family_id, 'friend', 'approved')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_user_friend_profile ON auth.users;
CREATE TRIGGER trg_handle_new_user_friend_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_friend_profile();
