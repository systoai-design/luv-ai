-- Create followers table for follow/following system
CREATE TABLE public.followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers table
CREATE POLICY "Followers are viewable by everyone"
ON public.followers
FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.followers
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
ON public.followers
FOR DELETE
USING (auth.uid() = follower_id);

-- Add indexes for performance
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);

-- Enable realtime for followers
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;