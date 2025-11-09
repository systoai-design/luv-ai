-- Fix matches table foreign keys to reference profiles instead of auth.users
ALTER TABLE matches 
  DROP CONSTRAINT IF EXISTS matches_user_id_1_fkey,
  DROP CONSTRAINT IF EXISTS matches_user_id_2_fkey;

ALTER TABLE matches
  ADD CONSTRAINT matches_user_id_1_profiles_fkey 
    FOREIGN KEY (user_id_1) 
    REFERENCES profiles(user_id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT matches_user_id_2_profiles_fkey 
    FOREIGN KEY (user_id_2) 
    REFERENCES profiles(user_id) 
    ON DELETE CASCADE;

-- Ensure RLS policies allow authenticated users to search
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Companions viewable by everyone" ON ai_companions;
CREATE POLICY "Companions viewable by everyone"
  ON ai_companions FOR SELECT
  USING (is_active = true);