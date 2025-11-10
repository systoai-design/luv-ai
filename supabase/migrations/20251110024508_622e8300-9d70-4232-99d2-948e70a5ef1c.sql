-- Add listened column for audio message tracking
ALTER TABLE user_messages ADD COLUMN IF NOT EXISTS listened boolean DEFAULT false;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS listened boolean DEFAULT false;

-- Ensure REPLICA IDENTITY FULL for real-time updates
ALTER TABLE chat_messages REPLICA IDENTITY FULL;