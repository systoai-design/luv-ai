-- Create badges table to store badge definitions
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  badge_type TEXT NOT NULL DEFAULT 'milestone',
  criteria JSONB NOT NULL,
  color TEXT DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_badges table to track which users earned which badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (publicly readable)
CREATE POLICY "Badges are viewable by everyone"
ON public.badges
FOR SELECT
USING (true);

-- RLS Policies for user_badges (publicly readable)
CREATE POLICY "User badges are viewable by everyone"
ON public.user_badges
FOR SELECT
USING (true);

-- Only authenticated users can be awarded badges (system will insert)
CREATE POLICY "System can award badges"
ON public.user_badges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to check and award badges for a user
CREATE OR REPLACE FUNCTION public.check_and_award_badges(check_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  badge_record RECORD;
  posts_count INTEGER;
  followers_count INTEGER;
  is_creator BOOLEAN;
  profile_complete BOOLEAN;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO posts_count
  FROM public.posts
  WHERE user_id = check_user_id;

  SELECT COUNT(*) INTO followers_count
  FROM public.followers
  WHERE following_id = check_user_id;

  SELECT can_create_companion INTO is_creator
  FROM public.profiles
  WHERE user_id = check_user_id;

  -- Check if profile is complete (has all required fields)
  SELECT 
    (display_name IS NOT NULL AND display_name != '' AND
     bio IS NOT NULL AND bio != '' AND
     avatar_url IS NOT NULL AND
     interests IS NOT NULL AND array_length(interests, 1) >= 3)
  INTO profile_complete
  FROM public.profiles
  WHERE user_id = check_user_id;

  -- Check each badge criteria and award if conditions met
  FOR badge_record IN SELECT * FROM public.badges LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE user_id = check_user_id AND badge_id = badge_record.id
    ) THEN
      -- Check criteria based on badge type
      IF badge_record.criteria->>'type' = 'posts_count' THEN
        IF posts_count >= (badge_record.criteria->>'value')::integer THEN
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (check_user_id, badge_record.id);
        END IF;
      ELSIF badge_record.criteria->>'type' = 'followers_count' THEN
        IF followers_count >= (badge_record.criteria->>'value')::integer THEN
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (check_user_id, badge_record.id);
        END IF;
      ELSIF badge_record.criteria->>'type' = 'verified_creator' THEN
        IF is_creator = true THEN
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (check_user_id, badge_record.id);
        END IF;
      ELSIF badge_record.criteria->>'type' = 'profile_complete' THEN
        IF profile_complete = true THEN
          INSERT INTO public.user_badges (user_id, badge_id)
          VALUES (check_user_id, badge_record.id);
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Insert initial badges
INSERT INTO public.badges (name, description, icon, badge_type, criteria, color) VALUES
('Early Adopter', 'One of the first users to join the platform', 'Sparkles', 'special', '{"type": "early_adopter"}', 'purple'),
('First Post', 'Created your first post', 'MessageSquare', 'milestone', '{"type": "posts_count", "value": 1}', 'blue'),
('10 Posts', 'Shared 10 posts with the community', 'FileText', 'milestone', '{"type": "posts_count", "value": 10}', 'blue'),
('50 Posts', 'Contributed 50 posts to the platform', 'BookOpen', 'milestone', '{"type": "posts_count", "value": 50}', 'blue'),
('First Follower', 'Gained your first follower', 'User', 'milestone', '{"type": "followers_count", "value": 1}', 'green'),
('10 Followers', 'Reached 10 followers', 'Users', 'milestone', '{"type": "followers_count", "value": 10}', 'green'),
('50 Followers', 'Built a following of 50 people', 'Users', 'milestone', '{"type": "followers_count", "value": 50}', 'green'),
('100 Followers', 'Reached 100 followers milestone', 'Users', 'milestone', '{"type": "followers_count", "value": 100}', 'green'),
('Verified Creator', 'Verified creator who can create AI companions', 'BadgeCheck', 'achievement', '{"type": "verified_creator"}', 'gold'),
('Profile Complete', 'Completed all profile information', 'CheckCircle', 'achievement', '{"type": "profile_complete"}', 'cyan');

-- Award "Early Adopter" badge to all existing users
INSERT INTO public.user_badges (user_id, badge_id)
SELECT p.user_id, b.id
FROM public.profiles p
CROSS JOIN public.badges b
WHERE b.name = 'Early Adopter'
ON CONFLICT (user_id, badge_id) DO NOTHING;