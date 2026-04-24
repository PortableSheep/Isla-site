-- Post reactions (emoji). Not moderated — reactions appear immediately.
-- Anyone on the wall can add/remove their own reaction; everyone on the
-- wall can read reactions on visible posts.

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(16) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone on the wall (admin or family member) can read reactions.
CREATE POLICY "Wall members can read reactions" ON post_reactions
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR post_id IN (
      SELECT id FROM posts
      WHERE family_id IS NULL
         OR family_id = public.auth_user_family_id()
         OR family_id IN (SELECT public.auth_user_owned_family_ids())
    )
  );

-- Authenticated users can add their own reactions to posts they can see.
CREATE POLICY "Users can add own reactions" ON post_reactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND post_id IN (
      SELECT id FROM posts
      WHERE family_id IS NULL
         OR family_id = public.auth_user_family_id()
         OR family_id IN (SELECT public.auth_user_owned_family_ids())
    )
  );

-- Users can remove their own reactions. Admin can remove any.
CREATE POLICY "Users can delete own reactions" ON post_reactions
  FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

GRANT ALL ON post_reactions TO authenticated;

-- Convenience view: reaction counts per post + emoji.
CREATE OR REPLACE VIEW post_reaction_counts AS
SELECT post_id, emoji, COUNT(*)::int AS count
FROM post_reactions
GROUP BY post_id, emoji;

GRANT SELECT ON post_reaction_counts TO authenticated;
