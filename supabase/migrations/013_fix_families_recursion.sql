-- Fix infinite RLS recursion between families <-> user_profiles policies.
--
-- Migration 012 added a SELECT policy on `families` that queries `user_profiles`.
-- `user_profiles` already has a policy ("Parents can view family profiles")
-- that queries `families`. Each policy triggers the other -> infinite recursion.
--
-- Fix: introduce SECURITY DEFINER helper functions that read the tables
-- without re-triggering RLS, and rewrite the policies to use them.

-- 1. Helper: family_id for the current auth.uid(), bypassing RLS.
CREATE OR REPLACE FUNCTION public.auth_user_family_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id
  FROM user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_family_id() TO authenticated;

-- 2. Helper: set of family ids the current auth.uid() owns (created).
CREATE OR REPLACE FUNCTION public.auth_user_owned_family_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
  FROM families
  WHERE created_by = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_owned_family_ids() TO authenticated;

-- 3. Rewrite the families member SELECT policy to use the helper (no cycle).
DROP POLICY IF EXISTS "Members can view their family" ON families;

CREATE POLICY "Members can view their family" ON families
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR id = public.auth_user_family_id()
  );

-- 4. Rewrite user_profiles policies that reference `families` so they use the
--    helper function instead, breaking the cycle from that side as well.

DROP POLICY IF EXISTS "Parents can view family profiles" ON user_profiles;
CREATE POLICY "Parents can view family profiles" ON user_profiles
  FOR SELECT
  USING (
    family_id IN (SELECT public.auth_user_owned_family_ids())
  );

DROP POLICY IF EXISTS "Parents can update child profiles in their family" ON user_profiles;
CREATE POLICY "Parents can update child profiles in their family" ON user_profiles
  FOR UPDATE
  USING (
    family_id IN (SELECT public.auth_user_owned_family_ids())
  )
  WITH CHECK (
    family_id IN (SELECT public.auth_user_owned_family_ids())
  );
