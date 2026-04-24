-- Allow family members (linked via user_profiles) to SELECT their family row.
-- Without this, users who were added to a family by someone else (e.g., via
-- invite flow or manual admin promotion) would not be able to see the family
-- on their dashboard, even though user_profiles.family_id points at it.

DROP POLICY IF EXISTS "Members can view their family" ON families;

CREATE POLICY "Members can view their family" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.family_id = families.id
    )
  );
