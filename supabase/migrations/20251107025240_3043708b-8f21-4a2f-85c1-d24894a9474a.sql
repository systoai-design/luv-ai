-- Phase 1: Create User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Presence is viewable by everyone"
  ON user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update own presence"
  ON user_presence FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence"
  ON user_presence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Create Swipe/Match System Tables
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Matches (when two users like each other)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count_1 INTEGER DEFAULT 0,
  unread_count_2 INTEGER DEFAULT 0,
  CONSTRAINT ordered_users CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

-- User to user messages
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view their matches"
  ON matches FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can update their matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Messages policies
CREATE POLICY "Users can view messages in their matches"
  ON user_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = user_messages.match_id 
      AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON user_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = user_messages.match_id 
      AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update read status"
  ON user_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = user_messages.match_id 
      AND (matches.user_id_1 = auth.uid() OR matches.user_id_2 = auth.uid())
    )
  );

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;

-- Function to check for mutual likes and create match
CREATE OR REPLACE FUNCTION check_and_create_match()
RETURNS TRIGGER AS $$
DECLARE
  match_user_1 UUID;
  match_user_2 UUID;
BEGIN
  IF NEW.action = 'like' OR NEW.action = 'super_like' THEN
    IF EXISTS (
      SELECT 1 FROM swipes 
      WHERE user_id = NEW.target_user_id 
      AND target_user_id = NEW.user_id 
      AND action IN ('like', 'super_like')
    ) THEN
      match_user_1 := LEAST(NEW.user_id, NEW.target_user_id);
      match_user_2 := GREATEST(NEW.user_id, NEW.target_user_id);
      
      INSERT INTO matches (user_id_1, user_id_2)
      VALUES (match_user_1, match_user_2)
      ON CONFLICT (user_id_1, user_id_2) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create matches
CREATE TRIGGER create_match_on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_match();

-- Function to update match last message time
CREATE OR REPLACE FUNCTION update_match_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE matches
  SET last_message_at = NEW.created_at,
      unread_count_1 = CASE 
        WHEN NEW.sender_id = user_id_2 THEN unread_count_1 + 1 
        ELSE unread_count_1 
      END,
      unread_count_2 = CASE 
        WHEN NEW.sender_id = user_id_1 THEN unread_count_2 + 1 
        ELSE unread_count_2 
      END
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_match_on_message
  AFTER INSERT ON user_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_last_message();