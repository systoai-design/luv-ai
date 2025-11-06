-- Fix security issue: Set search_path for function
DROP FUNCTION IF EXISTS increment_chat_message_count(UUID);

CREATE OR REPLACE FUNCTION increment_chat_message_count(chat_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_chats 
  SET total_messages = total_messages + 1,
      last_message_at = now()
  WHERE id = chat_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;