-- Super Like Usage Tracking
CREATE TABLE super_like_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE super_like_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own super like usage"
  ON super_like_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own super like usage"
  ON super_like_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own super like usage"
  ON super_like_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check and increment super likes
CREATE OR REPLACE FUNCTION check_super_like_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT count INTO current_count
  FROM super_like_usage
  WHERE user_id = p_user_id 
    AND usage_date = CURRENT_DATE;
  
  IF current_count IS NULL THEN
    INSERT INTO super_like_usage (user_id, usage_date, count)
    VALUES (p_user_id, CURRENT_DATE, 1);
    RETURN jsonb_build_object('allowed', true, 'remaining', 4);
  END IF;
  
  IF current_count < 5 THEN
    UPDATE super_like_usage
    SET count = count + 1
    WHERE user_id = p_user_id 
      AND usage_date = CURRENT_DATE;
    RETURN jsonb_build_object('allowed', true, 'remaining', 4 - current_count);
  END IF;
  
  RETURN jsonb_build_object('allowed', false, 'remaining', 0);
END;
$$;

-- Super Like Notifications
CREATE TABLE super_like_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  viewed boolean DEFAULT false
);

ALTER TABLE super_like_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications sent to them"
  ON super_like_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can insert notifications they send"
  ON super_like_notifications FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update notifications sent to them"
  ON super_like_notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Enable realtime for super like notifications
ALTER PUBLICATION supabase_realtime ADD TABLE super_like_notifications;

-- Undo Usage Tracking
CREATE TABLE undo_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

ALTER TABLE undo_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own undo usage"
  ON undo_usage FOR ALL
  USING (auth.uid() = user_id);

-- Function to check and increment undo usage
CREATE OR REPLACE FUNCTION check_undo_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  SELECT count INTO current_count
  FROM undo_usage
  WHERE user_id = p_user_id 
    AND usage_date = CURRENT_DATE;
  
  IF current_count IS NULL THEN
    INSERT INTO undo_usage (user_id, usage_date, count)
    VALUES (p_user_id, CURRENT_DATE, 1);
    RETURN jsonb_build_object('allowed', true, 'remaining', 2);
  END IF;
  
  IF current_count < 3 THEN
    UPDATE undo_usage
    SET count = count + 1
    WHERE user_id = p_user_id 
      AND usage_date = CURRENT_DATE;
    RETURN jsonb_build_object('allowed', true, 'remaining', 2 - current_count);
  END IF;
  
  RETURN jsonb_build_object('allowed', false, 'remaining', 0);
END;
$$;