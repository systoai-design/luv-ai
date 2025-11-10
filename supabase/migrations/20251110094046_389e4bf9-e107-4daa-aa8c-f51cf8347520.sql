-- Add visibility column to posts table
ALTER TABLE posts ADD COLUMN visibility text NOT NULL DEFAULT 'public';

-- Add constraint for visibility values
ALTER TABLE posts ADD CONSTRAINT posts_visibility_check 
  CHECK (visibility IN ('public', 'connections', 'private'));

-- Create index for better query performance
CREATE INDEX idx_posts_visibility ON posts(visibility);

-- Drop the old policy
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- Policy 1: Public posts viewable by everyone
CREATE POLICY "Public posts viewable by everyone" 
ON posts FOR SELECT 
USING (visibility = 'public');

-- Policy 2: Connections posts viewable by followers/following
CREATE POLICY "Connections posts viewable by connections" 
ON posts FOR SELECT 
USING (
  visibility = 'connections' AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM followers 
      WHERE (follower_id = auth.uid() AND following_id = posts.user_id)
         OR (following_id = auth.uid() AND follower_id = posts.user_id)
    )
  )
);

-- Policy 3: Private posts viewable by author only
CREATE POLICY "Private posts viewable by author only" 
ON posts FOR SELECT 
USING (visibility = 'private' AND user_id = auth.uid());

-- Keep existing insert/update/delete policies unchanged
-- Users can still create, update, and delete their own posts